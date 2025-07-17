import { NextResponse } from 'next/server';
import { exec as execCb } from 'child_process';
import { writeFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';

const exec = promisify(execCb);

export async function POST(request) {
  try {
    const { latexCode } = await request.json();
    if (!latexCode) {
      return NextResponse.json({ error: 'LaTeX code is required' }, { status: 400 });
    }

    // Create a unique temporary directory
    const tempDir = join(tmpdir(), `latex-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tempDir, { recursive: true });

    // Write LaTeX code to a .tex file
    const texFilePath = join(tempDir, 'resume.tex');
    await writeFile(texFilePath, latexCode, 'utf8');

    // Compile LaTeX to PDF using pdflatex
    const compileCommand = `pdflatex -interaction=nonstopmode -output-directory="${tempDir}" "${texFilePath}"`;
    try {
      await exec(compileCommand, { cwd: tempDir });
    } catch (compileError) {
      await rm(tempDir, { recursive: true, force: true });
      return NextResponse.json({
        error: 'LaTeX compilation failed. Please check your LaTeX code for errors.',
        details: compileError.stderr || compileError.message,
      }, { status: 400 });
    }

    // Read the generated PDF
    const pdfPath = join(tempDir, 'resume.pdf');
    const pdfBuffer = await readFileBuffer(pdfPath);

    // Clean up temp files
    await rm(tempDir, { recursive: true, force: true });

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: error.message,
    }, { status: 500 });
  }
}

// Helper function to read file as buffer
async function readFileBuffer(path) {
  const { readFile } = await import('fs/promises');
  return readFile(path);
} 