import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE individual certificate and update parent generation batch statistics
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the certificate to delete
    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Certificate with ID "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    // Delete the certificate
    await prisma.certificate.delete({
      where: { id },
    });

    // Update parent Generation statistics
    try {
      const isSuccess = certificate.status === 'GENERATED';
      
      await prisma.generation.update({
        where: { id: certificate.generationId },
        data: {
          totalRows: { decrement: 1 },
          ...(isSuccess 
            ? { successCount: { decrement: 1 } } 
            : { failedCount: { decrement: 1 } }
          ),
        },
      });
    } catch (dbErr) {
      console.error('Failed to update generation counts during certificate deletion:', dbErr);
      // Don't fail the request since certificate is already deleted
    }

    return NextResponse.json({
      success: true,
      data: { id, message: 'Certificate successfully deleted.' },
    });
  } catch (error: any) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to delete certificate',
        },
      },
      { status: 500 }
    );
  }
}
