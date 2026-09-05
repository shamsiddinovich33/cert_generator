import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET public statistics for landing page
export async function GET() {
  try {
    const [usersCount, certificatesCount, templatesCount] = await Promise.all([
      prisma.user.count(),
      prisma.certificate.count({ where: { status: 'GENERATED' } }),
      prisma.template.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: usersCount,
        certificates: certificatesCount,
        templates: templatesCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch statistics',
        },
      },
      { status: 500 }
    );
  }
}
