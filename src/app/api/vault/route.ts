import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('module');

    if (!moduleName) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const dirPath = path.join(
      os.homedir(), 
      'Documents', 
      'Obsidian', 
      'Academics', 
      'Modules', 
      moduleName
    );

    // List all files in root of module
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const categories: { name: string; items: string[] }[] = [];

    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.md')) {
        const name = file.name.replace('.md', '');
        // Ignore specific core files
        if (name === 'Pinboard' || name === 'Dashboard') continue;

        const content = await fs.promises.readFile(path.join(dirPath, file.name), 'utf-8');
        // Split by \n\n---\n\n or \n---\n
        const blocks = content.split(/\n\n---\n\n|\n---\n/).filter(b => b.trim() !== '');
        categories.push({ name, items: blocks });
      }
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Vault GET error:', error);
    if (error.code === 'ENOENT') return NextResponse.json({ categories: [] });
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function POST(request: Request) {
  // Create a new blank category file
  try {
    const body = await request.json();
    const { moduleName, categoryName } = body;
    if (!moduleName || !categoryName) return new NextResponse('Missing args', { status: 400 });

    const filePath = path.join(os.homedir(), 'Documents', 'Obsidian', 'Academics', 'Modules', moduleName, `${categoryName}.md`);
    
    // Ensure parent dir exists (it should, but just in case)
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    // Create empty file
    await fs.promises.writeFile(filePath, '', 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vault POST error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Overwrite a category file entirely
  try {
    const body = await request.json();
    const { moduleName, categoryName, items } = body;
    if (!moduleName || !categoryName || !Array.isArray(items)) return new NextResponse('Missing args', { status: 400 });

    const filePath = path.join(os.homedir(), 'Documents', 'Obsidian', 'Academics', 'Modules', moduleName, `${categoryName}.md`);
    
    const content = items.join('\n\n---\n\n');
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vault PUT error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('module');
    const categoryName = searchParams.get('category');
    
    if (!moduleName || !categoryName) return new NextResponse('Missing args', { status: 400 });

    const filePath = path.join(os.homedir(), 'Documents', 'Obsidian', 'Academics', 'Modules', moduleName, `${categoryName}.md`);
    
    await fs.promises.unlink(filePath);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Vault DELETE error:', error);
    if (error.code === 'ENOENT') return NextResponse.json({ success: true }); // already deleted
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { moduleName, oldCategoryName, newCategoryName } = body;
    if (!moduleName || !oldCategoryName || !newCategoryName) return new NextResponse('Missing args', { status: 400 });

    const oldPath = path.join(os.homedir(), 'Documents', 'Obsidian', 'Academics', 'Modules', moduleName, `${oldCategoryName}.md`);
    const newPath = path.join(os.homedir(), 'Documents', 'Obsidian', 'Academics', 'Modules', moduleName, `${newCategoryName}.md`);
    
    await fs.promises.rename(oldPath, newPath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vault PATCH error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
