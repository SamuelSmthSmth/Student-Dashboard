import { BaseDirectory, readDir, readTextFile as tauriReadTextFile, writeTextFile as tauriWriteTextFile, remove, mkdir } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';

const VAULT_ROOT = 'Obsidian/Academics';

// Returns true if we can connect (since we use a hardcoded scope, we just return true)
export async function getVaultHandle(promptIfMissing = false): Promise<boolean> {
  return true;
}

export async function readJsonFile(dirPath: any, fileName: string, defaultData: any = null) {
  try {
    const text = await tauriReadTextFile(`${VAULT_ROOT}/${fileName}`, { baseDir: BaseDirectory.Document });
    return JSON.parse(text);
  } catch (err: any) {
    return defaultData;
  }
}

export async function writeJsonFile(dirPath: any, fileName: string, data: any) {
  await tauriWriteTextFile(`${VAULT_ROOT}/${fileName}`, JSON.stringify(data, null, 2), { baseDir: BaseDirectory.Document });
}

function resolvePath(dirPath: any, fileName: string) {
  const relativeDir = typeof dirPath === 'string' ? dirPath : '';
  return relativeDir ? `${VAULT_ROOT}/${relativeDir}/${fileName}` : `${VAULT_ROOT}/${fileName}`;
}

export async function readTextFile(dirPath: any, fileName: string) {
  try {
    const path = resolvePath(dirPath, fileName);
    return await tauriReadTextFile(path, { baseDir: BaseDirectory.Document });
  } catch (err: any) {
    return '';
  }
}

export async function writeTextFile(dirPath: any, fileName: string, content: string) {
  const path = resolvePath(dirPath, fileName);
  await tauriWriteTextFile(path, content, { baseDir: BaseDirectory.Document });
}

export async function appendTextFile(dirPath: any, fileName: string, content: string) {
  const path = resolvePath(dirPath, fileName);
  try {
    let existingContent = '';
    try {
      existingContent = await tauriReadTextFile(path, { baseDir: BaseDirectory.Document });
    } catch (e) {}
    
    const newContent = existingContent ? `${existingContent}\n\n---\n\n${content}` : content;
    await tauriWriteTextFile(path, newContent, { baseDir: BaseDirectory.Document });
  } catch (err) {
    console.error("Failed to append", err);
    throw err;
  }
}

export async function deleteFile(dirPath: any, fileName: string) {
  const path = resolvePath(dirPath, fileName);
  try {
    await remove(path, { baseDir: BaseDirectory.Document });
  } catch (err: any) {}
}

export async function getPdfUrl(dirPath: any, fileName: string) {
  try {
    const docPath = await documentDir();
    const relativeDir = typeof dirPath === 'string' ? dirPath : '';
    const path = relativeDir ? `${VAULT_ROOT}/${relativeDir}` : VAULT_ROOT;
    const filePath = await join(docPath, path, fileName);
    return convertFileSrc(filePath);
  } catch (err) {
    console.error('Failed to get PDF', err);
    return null;
  }
}

export interface ModuleData {
  name: string;
  resources: {
    lectureNotes: string[];
    problemSheets: string[];
    pastPapers: string[];
    textbooks: string[];
  };
}

export async function scanModules(vaultHandle: any): Promise<ModuleData[]> {
  const modulesData: ModuleData[] = [];
  try {
    const entries = await readDir(`${VAULT_ROOT}/Modules`, { baseDir: BaseDirectory.Document });
    
    for (const entry of entries) {
      if (entry.isDirectory && entry.name && !entry.name.startsWith('.')) {
        const name = entry.name;
        
        const lectureNotes = await getFileNamesInDir(`Modules/${name}/Lecture Notes`);
        const problemSheets = await getFileNamesInDir(`Modules/${name}/Problem Sheets`);
        const pastPapers = await getFileNamesInDir(`Modules/${name}/Past Papers`);
        const textbooks = await getFileNamesInDir(`Modules/${name}/Textbooks`);

        modulesData.push({
          name,
          resources: { lectureNotes, problemSheets, pastPapers, textbooks }
        });
      }
    }
  } catch (err: any) {}
  return modulesData;
}

async function getFileNamesInDir(relPath: string): Promise<string[]> {
  try {
    const entries = await readDir(`${VAULT_ROOT}/${relPath}`, { baseDir: BaseDirectory.Document });
    const files: string[] = [];
    for (const entry of entries) {
      if (entry.isFile && entry.name && !entry.name.startsWith('.')) {
        files.push(entry.name);
      }
    }
    return files;
  } catch (err: any) {
    return [];
  }
}

export async function getVaultCategories(vaultHandle: any, moduleName: string) {
  const categories: { name: string; items: string[] }[] = [];
  try {
    const entries = await readDir(`${VAULT_ROOT}/Modules/${moduleName}`, { baseDir: BaseDirectory.Document });
    
    for (const entry of entries) {
      if (entry.isFile && entry.name && entry.name.endsWith('.md')) {
        const catName = entry.name.replace('.md', '');
        if (catName === 'Pinboard' || catName === 'Dashboard') continue;

        const content = await tauriReadTextFile(`${VAULT_ROOT}/Modules/${moduleName}/${entry.name}`, { baseDir: BaseDirectory.Document });
        const blocks = content.split(/\n\n---\n\n|\n---\n/).filter((b: string) => b.trim() !== '');
        categories.push({ name: catName, items: blocks });
      }
    }
  } catch (err: any) {}
  return categories;
}
