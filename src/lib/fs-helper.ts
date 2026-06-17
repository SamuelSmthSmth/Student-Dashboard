import { get, set } from 'idb-keyval';

// Gets the saved vault handle or prompts if not found
export async function getVaultHandle(promptIfMissing = false): Promise<FileSystemDirectoryHandle | null> {
  let handle = await get<FileSystemDirectoryHandle>('vaultHandle');
  if (handle) {
    // Verify permission
    if (await verifyPermission(handle, true)) {
      return handle;
    }
  }
  
  if (promptIfMissing) {
    if (!('showDirectoryPicker' in window)) {
      alert("Your browser does not support the File System Access API. Please use a Chromium-based browser like Google Chrome or Microsoft Edge.");
      return null;
    }
    try {
      handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await set('vaultHandle', handle);
      return handle;
    } catch (err) {
      console.error("User cancelled or failed to get directory picker", err);
      return null;
    }
  }
  return null;
}

async function verifyPermission(fileHandle: FileSystemHandle, readWrite: boolean) {
  const options: FileSystemHandlePermissionDescriptor = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  return false;
}

export async function readJsonFile(dirHandle: FileSystemDirectoryHandle, fileName: string, defaultData: any = null) {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return defaultData;
    }
    throw err;
  }
}

export async function writeJsonFile(dirHandle: FileSystemDirectoryHandle, fileName: string, data: any) {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export async function readTextFile(dirHandle: FileSystemDirectoryHandle, fileName: string) {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return '';
    }
    throw err;
  }
}

export async function writeTextFile(dirHandle: FileSystemDirectoryHandle, fileName: string, content: string) {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function appendTextFile(dirHandle: FileSystemDirectoryHandle, fileName: string, content: string) {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    let existingContent = '';
    
    const file = await fileHandle.getFile();
    if (file.size > 0) {
      existingContent = await file.text();
    }
    
    const writable = await fileHandle.createWritable();
    const newContent = existingContent ? `${existingContent}\n\n---\n\n${content}` : content;
    await writable.write(newContent);
    await writable.close();
  } catch (err) {
    console.error("Failed to append", err);
    throw err;
  }
}

export async function deleteFile(dirHandle: FileSystemDirectoryHandle, fileName: string) {
  try {
    await dirHandle.removeEntry(fileName);
  } catch (err: any) {
    if (err.name !== 'NotFoundError') throw err;
  }
}

export async function getPdfUrl(dirHandle: FileSystemDirectoryHandle, fileName: string) {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
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

export async function scanModules(vaultHandle: FileSystemDirectoryHandle): Promise<ModuleData[]> {
  const modulesData: ModuleData[] = [];
  try {
    const modulesDir = await vaultHandle.getDirectoryHandle('Modules');
    
    for await (const [name, handle] of (modulesDir as any).entries()) {
      if (handle.kind === 'directory' && !name.startsWith('.')) {
        const moduleDir = handle as FileSystemDirectoryHandle;
        
        const lectureNotes = await getFileNamesInDir(moduleDir, 'Lecture Notes');
        const problemSheets = await getFileNamesInDir(moduleDir, 'Problem Sheets');
        const pastPapers = await getFileNamesInDir(moduleDir, 'Past Papers');
        const textbooks = await getFileNamesInDir(moduleDir, 'Textbooks');

        modulesData.push({
          name,
          resources: { lectureNotes, problemSheets, pastPapers, textbooks }
        });
      }
    }
  } catch (err: any) {
    if (err.name !== 'NotFoundError') throw err;
  }
  return modulesData;
}

async function getFileNamesInDir(parent: FileSystemDirectoryHandle, dirName: string): Promise<string[]> {
  try {
    const dir = await parent.getDirectoryHandle(dirName);
    const files: string[] = [];
    for await (const [name, handle] of (dir as any).entries()) {
      if (handle.kind === 'file' && !name.startsWith('.')) {
        files.push(name);
      }
    }
    return files;
  } catch (err: any) {
    if (err.name === 'NotFoundError') return [];
    throw err;
  }
}

export async function getVaultCategories(vaultHandle: FileSystemDirectoryHandle, moduleName: string) {
  const categories: { name: string; items: string[] }[] = [];
  try {
    const modulesDir = await vaultHandle.getDirectoryHandle('Modules');
    const moduleDir = await modulesDir.getDirectoryHandle(moduleName);
    
    for await (const [name, handle] of (moduleDir as any).entries()) {
      if (handle.kind === 'file' && name.endsWith('.md')) {
        const catName = name.replace('.md', '');
        if (catName === 'Pinboard' || catName === 'Dashboard') continue;

        const fileHandle = handle as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const content = await file.text();
        const blocks = content.split(/\n\n---\n\n|\n---\n/).filter((b: string) => b.trim() !== '');
        categories.push({ name: catName, items: blocks });
      }
    }
  } catch (err: any) {
    if (err.name !== 'NotFoundError') throw err;
  }
  return categories;
}
