import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { generateCertificate } from '@/lib/pdf/generator';
import { TemplateConfiguration } from '@/types';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, configuration, fullName = 'Abdullayev Muhammadali', certificateId = 'K00001' } = body;

    if (!templateId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Template ID is required.',
          },
        },
        { status: 400 }
      );
    }

    // Fetch template details
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Template with ID "${templateId}" not found`,
          },
        },
        { status: 404 }
      );
    }

    // Read the PDF template file from storage
    const absolutePath = storageService.getFilePath(template.originalFileUrl);
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'Original PDF template file not found on server.',
          },
        },
        { status: 500 }
      );
    }

    const templatePdfBuffer = fs.readFileSync(absolutePath);

    // Use current configuration or fallback to stored configuration
    const activeConfig = (configuration || template.configuration) as unknown as TemplateConfiguration;

    // Generate certificate
    const result = await generateCertificate({
      templatePdfBuffer,
      configuration: activeConfig,
      fieldValues: {
        fullName,
        certificateId,
        ...(body.dynamicFields || {}),
      },
    });

    if (!result.success || !result.pdfBuffer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.error || 'PREVIEW_GENERATION_FAILED',
            message: `Preview generation failed: ${result.error}`,
          },
        },
        { status: 400 }
      );
    }

    // Return the PDF buffer directly with appropriate headers
    return new NextResponse(result.pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Error generating preview PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to generate preview PDF.',
        },
      },
      { status: 500 }
    );
  }
}
