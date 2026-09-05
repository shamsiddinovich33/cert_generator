import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import Sidebar from '@/components/layout/sidebar';
import './globals.css';
import { auth } from '@/auth';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Certificate Generator — Avtomatik PDF Sertifikatlar Yaratuvchi',
  description: 'PDF shablon va Excel ma’lumotlaridan foydalanib avtomatik individual sertifikatlar yaratuvchi tizim',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="uz" className={`${outfit.variable} dark`}>
      <body className="font-sans antialiased bg-slate-950 text-slate-100 min-h-screen flex">
        {session && <Sidebar />}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
