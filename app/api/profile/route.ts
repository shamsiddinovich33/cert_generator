import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Ism juda qisqa.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: body.name.trim() }
    });

    return NextResponse.json({ success: true, user: { name: updated.name } });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    // The database schema should have cascading deletes setup for user relations.
    // If not, we should delete them manually. Let's delete them manually to be safe.
    
    // 1. Delete certificates
    await prisma.certificate.deleteMany({ where: { userId: user.id } });
    
    // 2. Delete generations
    await prisma.generation.deleteMany({ where: { userId: user.id } });
    
    // 3. Delete templates
    await prisma.template.deleteMany({ where: { userId: user.id } });
    
    // 4. Delete user
    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ success: false, error: 'Server xatosi' }, { status: 500 });
  }
}
