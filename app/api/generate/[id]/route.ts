import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth/session';

// GET specific generation batch detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const generation = await prisma.generation.findUnique({
      where: { id, userId: user.id },
      include: {
        certificates: {
          orderBy: { createdAt: 'asc' },
        },
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

    return NextResponse.json({
      success: true,
      data: generation,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to fetch generation batch',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE generation batch (removes database rows and cleans up ZIP files)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const generation = await prisma.generation.findUnique({
      where: { id, userId: user.id },
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

    // 1. Delete associated ZIP file from local disk
    if (generation.zipFileUrl) {
      await storageService.deleteFile(generation.zipFileUrl);
    }

    // 2. Delete generation record (Cascade constraint deletes associated Certificates automatically)
    await prisma.generation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id, message: 'Generation batch successfully deleted.' },
    });
  } catch (error: any) {
    console.error('Error deleting generation batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to delete generation batch',
        },
      },
      { status: 500 }
    );
  }
}
