import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, code, newPassword, confirmPassword } = await request.json();

    if (!email || !code || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Barcha maydonlarni to\'ldirish shart' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Yangi parollar bir-biriga mos kelmadi' },
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
        { success: false, error: 'Kodni amal qilish muddati tugagan. Iltimos, qaytadan kod so\'rang' },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete used reset codes
    await prisma.passwordResetCode.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Parol muvaffaqiyatli yangilandi! Endi yangi parol bilan kirishingiz mumkin.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Server xatosi yuz berdi' },
      { status: 500 }
    );
  }
}
