import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const certificates = await prisma.certificate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        generation: {
          select: {
            sourceFileName: true,
            templateName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: certificates,
    });
  } catch (error: any) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to fetch certificates',
        },
      },
      { status: 500 }
    );
  }
}
