import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Define the absolute path to the Obsidian internships data file
const OBSIDIAN_DATA_PATH = path.join(os.homedir(), 'Documents', 'Obsidian', 'Academics', 'internships.json');

export async function GET() {
  try {
    try {
      await fs.access(OBSIDIAN_DATA_PATH);
    } catch {
      // File doesn't exist, return empty array
      return NextResponse.json({ data: [] });
    }

    const fileContents = await fs.readFile(OBSIDIAN_DATA_PATH, 'utf-8');
    if (!fileContents.trim()) {
      return NextResponse.json({ data: [] });
    }
    const data = JSON.parse(fileContents);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error reading internships data:', error);
    // Return empty array on read errors so frontend doesn't crash
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Ensure directory exists
    const dir = path.dirname(OBSIDIAN_DATA_PATH);
    await fs.mkdir(dir, { recursive: true });

    // Overwrite the JSON file using JSON.stringify
    await fs.writeFile(OBSIDIAN_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing internships data:', error);
    return NextResponse.json({ error: 'Failed to write internships data' }, { status: 500 });
  }
}
