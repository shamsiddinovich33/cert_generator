import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import Sidebar from '@/components/layout/sidebar';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Certificate Generator — Avtomatik PDF Sertifikatlar Yaratuvchi',
  description: 'PDF shablon va Excel ma’lumotlaridan foydalanib avtomatik individual sertifikatlar yaratuvchi tizim',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${outfit.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950/20 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
