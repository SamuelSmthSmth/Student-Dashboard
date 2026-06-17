import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Force dynamic rendering so Next.js doesn't cache the local file system scan at build time
export const dynamic = 'force-dynamic';

// Define the absolute path to the Obsidian Modules directory
const OBSIDIAN_MODULES_PATH = path.join(os.homedir(), 'Documents', 'Obsidian', 'Academics', 'Modules');

export interface ModuleData {
  name: string;
  resources: {
    lectureNotes: string[];
    problemSheets: string[];
    pastPapers: string[];
    textbooks: string[];
  };
}

// Helper to safely read a directory and return file names, ignoring hidden files
async function safeReadDir(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
      .map(entry => entry.name);
  } catch (error: any) {
    // If directory doesn't exist (ENOENT) or we don't have permissions, return empty array safely
    if (error.code !== 'ENOENT') {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
    return [];
  }
}

export async function GET() {
  try {
    let moduleEntries;
    try {
      moduleEntries = await fs.readdir(OBSIDIAN_MODULES_PATH, { withFileTypes: true });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Base modules directory doesn't exist yet
        return NextResponse.json({ data: [] });
      }
      throw error;
    }

    const modulesData: ModuleData[] = [];

    // Scan each module folder
    for (const entry of moduleEntries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const modulePath = path.join(OBSIDIAN_MODULES_PATH, entry.name);
        
        // Scan specific subdirectories within the module
        const lectureNotes = await safeReadDir(path.join(modulePath, 'Lecture Notes'));
        const problemSheets = await safeReadDir(path.join(modulePath, 'Problem Sheets'));
        const pastPapers = await safeReadDir(path.join(modulePath, 'Past Papers'));
        const textbooks = await safeReadDir(path.join(modulePath, 'Textbooks'));

        modulesData.push({
          name: entry.name, // e.g. "Linear Algebra (CAM)"
          resources: {
            lectureNotes,
            problemSheets,
            pastPapers,
            textbooks
          }
        });
      }
    }

    return NextResponse.json({ data: modulesData });
  } catch (error) {
    console.error('Error in modules API:', error);
    // Return empty array to prevent frontend crashes on catastrophic failures
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
