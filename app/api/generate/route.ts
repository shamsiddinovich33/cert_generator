import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { generateCertificate } from '@/lib/pdf/generator';
import { generateZip } from '@/lib/zip/generator';
import { ParticipantInput, TemplateConfiguration } from '@/types';
import fs from 'fs';

// Helper function to process the batch in the background
async function processBatch(
  generationId: string,
  templateId: string,
  participants: ParticipantInput[],
  sourceFileName: string
) {
  let successCount = 0;
  let failedCount = 0;
  const tempFiles: { fullName: string; certificateId: string; region?: string; filePath: string }[] = [];

  try {
    // 1. Fetch the template
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found.');
    }

    const templatePdfPath = storageService.getFilePath(template.originalFileUrl);
    if (!fs.existsSync(templatePdfPath)) {
      throw new Error('Original PDF template file is missing on server.');
    }
    const templatePdfBuffer = fs.readFileSync(templatePdfPath);

    // Save snapshot of template name and configuration on the Generation record
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        templateName: template.name,
        configuration: template.configuration as any,
      },
    });

    const activeConfig = template.configuration as unknown as TemplateConfiguration;

    // 2. Loop through participants
    for (const participant of participants) {
      // Create Certificate record in PENDING status
      const certRecord = await prisma.certificate.create({
        data: {
          generationId,
          fullName: participant.fullName || 'Noma\'lum',
          certificateId: participant.certificateId || `ID_${participant.sourceRow}`,
          region: participant.region,
          dynamicFields: participant.dynamicFields || {},
          sourceRow: participant.sourceRow,
          fileName: '',
          status: 'PENDING',
        },
      });

      // Generate the PDF
      const result = await generateCertificate({
        templatePdfBuffer,
        configuration: activeConfig,
        fieldValues: {
          fullName: participant.fullName,
          certificateId: participant.certificateId,
          ...participant.dynamicFields,
        },
      });

      if (result.success && result.pdfBuffer) {
        // Save PDF to temp folder
        const cleanName = participant.fullName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const cleanId = participant.certificateId.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const fileName = `${cleanName}_${cleanId}.pdf`;
        
        const tempFileUrl = await storageService.saveFile(
          result.pdfBuffer,
          fileName,
          'temp'
        );
        const tempFilePath = storageService.getFilePath(tempFileUrl);

        tempFiles.push({
          fullName: participant.fullName,
          certificateId: participant.certificateId,
          region: participant.region,
          filePath: tempFilePath,
        });

        // Update Certificate in DB
        await prisma.certificate.update({
          where: { id: certRecord.id },
          data: {
            status: 'GENERATED',
            fileName,
            fileUrl: tempFileUrl,
          },
        });

        successCount++;
      } else {
        // Update Certificate to FAILED in DB
        await prisma.certificate.update({
          where: { id: certRecord.id },
          data: {
            status: 'FAILED',
            errorMessage: result.error || 'Unknown PDF generation error',
          },
        });

        failedCount++;
      }

      // Update Generation counts periodically to show progress
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          successCount,
          failedCount,
        },
      });
    }

    // 3. Zip successful PDFs
    let zipFileUrl: string | null = null;

    if (successCount > 0) {
      const zipEntries = tempFiles.map((tf) => ({
        fullName: tf.fullName,
        certificateId: tf.certificateId,
        region: tf.region,
        pdfBuffer: fs.readFileSync(tf.filePath),
      }));

      const zipBuffer = await generateZip(zipEntries);
      const zipFileName = `certificates_${generationId}.zip`;
      zipFileUrl = await storageService.saveFile(zipBuffer, zipFileName, 'zip');
    }

    // 4. Cleanup temporary PDF files
    for (const tf of tempFiles) {
      try {
        if (fs.existsSync(tf.filePath)) {
          fs.unlinkSync(tf.filePath);
        }
      } catch (err) {
        console.error('Failed to cleanup temp file:', tf.filePath, err);
      }
    }

    // 5. Complete Generation
    let finalStatus = 'COMPLETED';
    if (successCount === 0) {
      finalStatus = 'FAILED';
    } else if (failedCount > 0) {
      finalStatus = 'COMPLETED_WITH_ERRORS';
    }

    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: finalStatus,
        zipFileUrl,
        completedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error during generation batch background process:', error);

    // Fail the batch
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
      },
    }).catch(console.error);

    // Attempt cleanup of temp files in case of crash
    for (const tf of tempFiles) {
      try {
        if (fs.existsSync(tf.filePath)) {
          fs.unlinkSync(tf.filePath);
        }
      } catch (err) {
        // Ignore
      }
    }
  }
}

// POST start generation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, sourceFileName, mapping, participants } = body;

    if (!templateId || !participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Template ID and participant list are required.',
          },
        },
        { status: 400 }
      );
    }

    // Create a database record for Generation in PENDING / PROCESSING status
    const generation = await prisma.generation.create({
      data: {
        templateId,
        templateName: '', // Will be snapshot on background run
        configuration: {}, // Will be snapshot on background run
        sourceType: sourceFileName.toLowerCase().endsWith('.csv') ? 'CSV' : 'EXCEL',
        sourceFileName,
        totalRows: participants.length,
        status: 'PROCESSING',
      },
    });

    // Start background process
    processBatch(generation.id, templateId, participants, sourceFileName);

    return NextResponse.json({
      success: true,
      data: {
        generationId: generation.id,
        status: 'PROCESSING',
      },
    });
  } catch (error: any) {
    console.error('Error starting generation batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to start generation batch.',
        },
      },
      { status: 500 }
    );
  }
}

// GET all generation batches
export async function GET() {
  try {
    const generations = await prisma.generation.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      success: true,
      data: generations,
    });
  } catch (error: any) {
    console.error('Error fetching generations:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to fetch generation history.',
        },
      },
      { status: 500 }
    );
  }
}
