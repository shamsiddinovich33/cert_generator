import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email va tasdiqlash kodini kiritish shart' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Foydalanuvchi topilmadi' },
        { status: 404 }
      );
    }

    const resetCode = await prisma.passwordResetCode.findFirst({
      where: {
        userId: user.id,
        code: cleanCode,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetCode) {
      return NextResponse.json(
        { success: false, error: 'Tasdiqlash kodi noto\'g\'ri' },
        { status: 400 }
      );
    }

    if (new Date() > resetCode.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Kodni amal qilish muddati tugagan. Iltimos, yangi kod so\'rang' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kod to\'g\'ri tasdiqlandi',
    });
  } catch (error: any) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { success: false, error: 'Server xatosi yuz berdi' },
      { status: 500 }
    );
  }
}
