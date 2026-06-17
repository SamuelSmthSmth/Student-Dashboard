import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

const configPath = path.join(
  os.homedir(), 
  'Documents', 
  'Obsidian', 
  'Academics', 
  'dashboard.json'
);

export async function GET() {
  try {
    const data = await fs.promises.readFile(configPath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      const defaultConfig = {
        categories: {},
        defaultCategory: 'Uncategorized'
      };
      return NextResponse.json(defaultConfig);
    }
    console.error('Error reading dashboard.json:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing dashboard.json:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
