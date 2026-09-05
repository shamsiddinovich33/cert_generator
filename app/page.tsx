import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileCheck, 
  FileSpreadsheet, 
  History, 
  Award, 
  CheckCircle,
  Plus,
  ArrowRight,
  Upload,
  Download
} from 'lucide-react';
import { auth } from '@/auth';

export const revalidate = 60; // Cache for 60 seconds

async function getPublicStats() {
  try {
    const [users, certificates, templates] = await Promise.all([
      prisma.user.count(),
      prisma.certificate.count({ where: { status: 'GENERATED' } }),
      prisma.template.count(),
    ]);
    return { users, certificates, templates };
  } catch (err) {
    return { users: 0, certificates: 0, templates: 0 };
  }
}

export default async function HomePage() {
  const session = await auth();
  
  if (session) {
    // ----------------------------------------------------
    // AUTHENTICATED DASHBOARD VIEW
    // ----------------------------------------------------
    const stats = {
      templates: await prisma.template.count({ where: { userId: session.user?.id } }),
      batches: await prisma.generation.count({ where: { userId: session.user?.id } }),
      certificates: await prisma.certificate.count({ where: { userId: session.user?.id, status: 'GENERATED' } }),
    };

    return (
      <div className="p-8 max-w-7xl mx-auto w-full space-y-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Salom, {session.user?.name || 'Foydalanuvchi'}!
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Sertifikat shablonlarini boshqarish va Excel ma'lumotlaridan PDF generatsiya qilish.
            </p>
          </div>
          <Link href="/generate">
            <Button className="flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Sertifikat Yaratish</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 text-indigo-500/10 group-hover:text-indigo-500/15 transition-colors">
              <FileCheck className="h-24 w-24 -mr-6 -mt-6" />
            </div>
            <CardContent className="p-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Shablonlar soni</span>
              <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white mt-2">{stats.templates}</h2>
              <Link href="/templates" className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline mt-4">
                Shablonlarni boshqarish →
              </Link>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 text-violet-500/10 group-hover:text-violet-500/15 transition-colors">
              <History className="h-24 w-24 -mr-6 -mt-6" />
            </div>
            <CardContent className="p-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Generatsiya tarixi</span>
              <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white mt-2">{stats.batches}</h2>
              <Link href="/history" className="inline-flex items-center text-xs font-semibold text-violet-600 hover:underline mt-4">
                Tarixni ko'rish →
              </Link>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:text-emerald-500/15 transition-colors">
              <Award className="h-24 w-24 -mr-6 -mt-6" />
            </div>
            <CardContent className="p-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Jami Sertifikatlar</span>
              <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white mt-2">{stats.certificates}</h2>
              <Link href="/certificates" className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:underline mt-4">
                Sertifikatlar ro'yxati →
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/10">
          <div className="max-w-2xl relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Yangi sertifikatlar oqimini yarating
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
              <Link href="/generate">
                <Button size="lg" className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-slate-100 shadow-none border-none">
                  Generatsiyani boshlash
                </Button>
              </Link>
              <Link href="/templates/new">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 hover:bg-white/10 hover:text-white text-white">
                  <Plus className="h-4 w-4 mr-2" /> Yangi shablon qo'shish
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // UNAUTHENTICATED LANDING PAGE VIEW
  // ----------------------------------------------------
  const publicStats = await getPublicStats();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <Award className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">CertGen</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Kirish
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Boshlash</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden flex-1 flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.25),rgba(15,23,42,0))]" />
        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>Tezkor & Avtomatik PDF generatsiyasi</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Sertifikatlarni{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              avtomatlashtiring
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Bo'sh PDF shablonni yuklang, maydonlarni joylashtiring va Excel faylidagi yuzlab odamlarga bir soniyada individual sertifikatlar generatsiya qiling.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
            <Link href="/auth/register">
              <Button size="lg" className="h-14 px-8 text-base w-full sm:w-auto shadow-xl shadow-indigo-600/30">
                Bepul boshlash <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900/60 border-y border-slate-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="py-4 md:py-0">
              <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {publicStats.users}+
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                Ro'yxatdan o'tganlar
              </div>
            </div>
            <div className="py-4 md:py-0">
              <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {publicStats.templates}+
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                PDF Shablonlar
              </div>
            </div>
            <div className="py-4 md:py-0">
              <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {publicStats.certificates}+
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                Yaratilgan Sertifikatlar
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Qanday ishlaydi?
            </h2>
            <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto">
              Sertifikat yaratish jarayoni juda oson va atigi 3 ta qadamdan iborat
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-indigo-950/50 group text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-indigo-950/80 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-800/60 group-hover:scale-110 transition-transform shadow-inner">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">1. PDF shablon yuklang</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                O'zingizning bo'sh dizayningizni PDF formatida tizimga kiritasiz va kutiladigan joylarni belgilaysiz.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-violet-950/50 group text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-violet-950/80 rounded-2xl flex items-center justify-center text-violet-400 border border-violet-800/60 group-hover:scale-110 transition-transform shadow-inner">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">2. Excel ulang</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Ro'yxatingizdagi barcha o'quvchi yoki xodimlar ismlari tushirilgan Excel yoki CSV faylini yuklaysiz.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-950/50 group text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-emerald-950/80 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-800/60 group-hover:scale-110 transition-transform shadow-inner">
                <Download className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">3. ZIP qilib oling</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Tizim soniyalar ichida yuzlab sertifikatlarni bitta ZIP faylga qadoqlab, tayyor holda taqdim etadi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-1.5 bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-white">CertGen</span>
          </div>
          <p className="text-slate-500 text-xs">© 2026 CertGen Platformasi. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>
    </div>
  );
}
