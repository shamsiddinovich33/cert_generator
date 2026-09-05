import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { generateCertificate } from '@/lib/pdf/generator';
import { storageService } from '@/lib/storage';
import fs from 'fs';
import { TemplateConfiguration } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const certificate = await prisma.certificate.findUnique({
      where: { id, userId: user.id },
      include: {
        generation: {
          include: {
            template: true,
          }
        }
      }
    });

    if (!certificate || !certificate.generation?.template) {
      return NextResponse.json(
        { success: false, error: 'Sertifikat yoki shablon topilmadi' },
        { status: 404 }
      );
    }

    const templatePdfPath = storageService.getFilePath(certificate.generation.template.originalFileUrl);
    if (!fs.existsSync(templatePdfPath)) {
      return NextResponse.json(
        { success: false, error: 'Shablonning asl fayli yo\'qolgan' },
        { status: 404 }
      );
    }

    const templatePdfBuffer = fs.readFileSync(templatePdfPath);
    
    // Use the snapshot configuration from generation if available, otherwise fallback to current template config
    const activeConfig = (certificate.generation.configuration || certificate.generation.template.configuration) as unknown as TemplateConfiguration;

    const result = await generateCertificate({
      templatePdfBuffer,
      configuration: activeConfig,
      fieldValues: {
        fullName: certificate.fullName,
        certificateId: certificate.certificateId,
        ...((certificate.dynamicFields as Record<string, string>) || {}),
      }
    });

    if (!result.success || !result.pdfBuffer) {
      return NextResponse.json(
        { success: false, error: 'PDF generatsiya qilishda xatolik: ' + result.error },
        { status: 500 }
      );
    }

    return new NextResponse(result.pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certificate.fileName || 'certificate.pdf'}"`,
      },
    });
  } catch (error: any) {
    console.error('Single certificate download error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
