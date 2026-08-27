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
  Plus
} from 'lucide-react';

export const revalidate = 0; // Disable caching so it updates on every reload

export default async function Dashboard() {
  let stats = {
    templates: 0,
    batches: 0,
    certificates: 0,
  };

  try {
    stats.templates = await prisma.template.count();
    stats.batches = await prisma.generation.count();
    stats.certificates = await prisma.certificate.count({
      where: { status: 'GENERATED' }
    });
  } catch (error) {
    console.warn('Prisma stats loading failed. Database tables might not be created yet.', error);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-white dark:to-slate-350 bg-clip-text text-transparent">
            Dashboard
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

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 text-indigo-500/10 group-hover:text-indigo-500/15 transition-colors">
            <FileCheck className="h-24 w-24 -mr-6 -mt-6" />
          </div>
          <CardContent className="p-6">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Shablonlar soni</span>
            <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white mt-2">{stats.templates}</h2>
            <Link href="/templates" className="inline-flex items-center text-xs font-semibold text-indigo-650 hover:underline mt-4">
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
            <Link href="/history" className="inline-flex items-center text-xs font-semibold text-violet-650 hover:underline mt-4">
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

      {/* Main Call to Action Box */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-550/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-2xl relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-xs font-semibold text-indigo-300">
            <CheckCircle className="h-4 w-4" />
            <span>Tezkor & Xavfsiz MVP Generator</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            PDF Shablon + Excel ma'lumotlari orqali sertifikatlar yarating
          </h2>
          
          <p className="text-slate-350 text-sm md:text-base font-medium leading-relaxed">
            Sertifikat dizaynini belgilang, Full Name (Georgia) va Certificate ID (Bahnschrift) joylashuvini drag-and-drop orqali sozlang va avtomatik ravishda ZIP formatida yuklab oling.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <Link href="/generate">
              <Button size="lg" className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-slate-100 shadow-none border-none">
                Generatsiyani boshlash
              </Button>
            </Link>
            <Link href="/templates/new">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 hover:bg-white/10 hover:text-white text-white">
                <Plus className="h-4 w-4 mr-2" />
                Yangi Shablon qo'shish
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
