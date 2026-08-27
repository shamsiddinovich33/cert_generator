import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const downloadType = searchParams.get('type') || 'zip'; // 'zip' or 'error'

    const generation = await prisma.generation.findUnique({
      where: { id },
      include: {
        certificates: true,
      },
    });

    if (!generation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Generation batch with ID "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    // 1. Download Error Report
    if (downloadType === 'error') {
      const failedCerts = generation.certificates.filter((c) => c.status === 'FAILED');

      // CSV Content construction
      let csvContent = '\uFEFFRow,Full Name,ID,Error\n'; // Include BOM for proper Excel encoding
      failedCerts.forEach((cert) => {
        const escapedFullName = `"${cert.fullName.replace(/"/g, '""')}"`;
        const escapedId = `"${cert.certificateId.replace(/"/g, '""')}"`;
        const escapedError = `"${(cert.errorMessage || '').replace(/"/g, '""')}"`;
        csvContent += `${cert.sourceRow},${escapedFullName},${escapedId},${escapedError}\n`;
      });

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="error_report_${generation.id}.csv"`,
        },
      });
    }

    // 2. Download ZIP
    if (!generation.zipFileUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ZIP_NOT_AVAILABLE',
            message: 'No ZIP archive available for this batch.',
          },
        },
        { status: 400 }
      );
    }

    const zipFilePath = storageService.getFilePath(generation.zipFileUrl);

    if (!fs.existsSync(zipFilePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'ZIP file was not found on server.',
          },
        },
        { status: 404 }
      );
    }

    const zipBuffer = fs.readFileSync(zipFilePath);

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="certificates_${generation.id}.zip"`,
      },
    });
  } catch (error: any) {
    console.error('Error during download process:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to download file.',
        },
      },
      { status: 500 }
    );
  }
}
