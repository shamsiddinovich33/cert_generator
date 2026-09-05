import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email manzilini kiritish shart' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Bunday email bilan ro\'yxatdan o\'tgan foydalanuvchi topilmadi' },
        { status: 404 }
      );
    }

    // Delete existing unused reset codes for this user
    await prisma.passwordResetCode.deleteMany({
      where: { userId: user.id },
    });

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.passwordResetCode.create({
      data: {
        code,
        userId: user.id,
        expiresAt,
      },
    });

    // Send email
    const mailResult = await sendPasswordResetEmail(cleanEmail, code);
    if (!mailResult.success) {
      return NextResponse.json(
        { success: false, error: mailResult.error || 'Emailga xat yuborishda xatolik yuz berdi' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tasdiqlash kodi emailingizga yuborildi',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Server xatosi yuz berdi' },
      { status: 500 }
    );
  }
}
