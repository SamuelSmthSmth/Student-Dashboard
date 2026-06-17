import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('module');
    const category = searchParams.get('category'); // This can be empty/null
    const fileName = searchParams.get('file');

    if (!moduleName || !fileName) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // Resolve the absolute path. If category is empty, it resolves to the module root.
    const filePath = path.join(
      os.homedir(), 
      'Documents', 
      'Obsidian', 
      'Academics', 
      'Modules', 
      moduleName, 
      category || '', 
      fileName
    );

    // Ensure the file exists
    const fileStat = await fs.promises.stat(filePath);

    // Handle PDFs (Streaming via buffer for Next.js App Router compatibility)
    if (fileName.toLowerCase().endsWith('.pdf')) {
      const fileBuffer = fs.readFileSync(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': fileStat.size.toString(),
          // Optional: Add caching headers if needed, but 'no-store' keeps it fresh locally
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    } 
    
    // Handle Markdown or text files (like Pinboard.md)
    else {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return NextResponse.json({ content });
    }

  } catch (error: any) {
    console.error('File serving error:', error);
    
    if (error.code === 'ENOENT') {
      return new NextResponse('File not found', { status: 404 });
    }
    
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { moduleName, category, fileName, content } = body;

    if (!moduleName || !fileName || !content) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const dirPath = path.join(
      os.homedir(), 
      'Documents', 
      'Obsidian', 
      'Academics', 
      'Modules', 
      moduleName, 
      category || ''
    );
    
    // Ensure directory exists
    await fs.promises.mkdir(dirPath, { recursive: true });

    const filePath = path.join(dirPath, fileName);
    
    // Format the append block cleanly
    let appendContent = `\n\n---\n\n${content}`;
    
    // Check if file exists to avoid leading separators on brand new files
    try {
      const stat = await fs.promises.stat(filePath);
      if (stat.size === 0) appendContent = content; // If it's an empty file, just put the content
    } catch (e: any) {
      if (e.code === 'ENOENT') {
         appendContent = content; // Brand new file
      }
    }

    await fs.promises.appendFile(filePath, appendContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File append error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { moduleName, category, fileName, content } = body;

    if (!moduleName || !fileName) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const dirPath = path.join(
      os.homedir(), 
      'Documents', 
      'Obsidian', 
      'Academics', 
      'Modules', 
      moduleName, 
      category || ''
    );
    
    await fs.promises.mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, fileName);
    
    await fs.promises.writeFile(filePath, content || '', 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File PUT error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
