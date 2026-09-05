import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { PDFDocument } from 'pdf-lib';
import { TemplateConfiguration } from '@/types';

import { getCurrentUser } from '@/lib/auth/session';

// GET all templates
export async function GET() {
  try {
    const user = await getCurrentUser();
    const templates = await prisma.template.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error?.message || 'Failed to fetch templates',
        },
      },
      { status: 500 }
    );
  }
}

// POST new template (upload PDF and set default config)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const file = formData.get('file') as File;

    if (!name || !file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name and PDF file are required.',
          },
        },
        { status: 400 }
      );
    }

    // Read PDF file as Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Save the PDF file
    const fileUrl = await storageService.saveFile(fileBuffer, file.name, 'templates');

    // Load PDF to inspect dimensions
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PDF',
            message: 'The uploaded PDF file contains no pages.',
          },
        },
        { status: 400 }
      );
    }

    const firstPage = pages[0];
    const { width: pageW, height: pageH } = firstPage.getSize();

    // Setup intelligent default configuration based on PDF dimensions
    const nameW = Math.min(400, pageW * 0.8);
    const nameH = Math.min(60, pageH * 0.1);
    const idW = Math.min(200, pageW * 0.4);
    const idH = Math.min(30, pageH * 0.05);

    const defaultConfiguration: TemplateConfiguration = {
      page: 1,
      fields: [],
    };

    // Save to DB
    const template = await prisma.template.create({
      data: {
        userId: user.id,
        name,
        description,
        originalFileUrl: fileUrl,
        configuration: defaultConfiguration as any,
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to create template',
        },
      },
      { status: 500 }
    );
  }
}
