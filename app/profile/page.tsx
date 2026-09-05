import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User, Shield, AlertTriangle } from 'lucide-react';
import ProfileForm, { DeleteAccountButton } from './profile-form';

export const metadata = {
  title: 'Mening Profilim',
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Mening Profilim
        </h1>
        <p className="text-slate-400 font-medium mt-1">
          Shaxsiy ma'lumotlaringizni boshqaring.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Forms */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-100">
                <User className="h-5 w-5 text-indigo-500" />
                <span>Asosiy Ma'lumotlar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm user={{ name: user.name, email: user.email }} />
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-rose-900/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <span>Xavfli Hudud</span>
              </CardTitle>
              <CardDescription className="text-slate-500">
                Akkountni o'chirish barcha shablonlar va generatsiya tarixini tiklab bo'lmas darajada o'chirib yuboradi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-4">
                Sizning barcha yaratgan sertifikatlaringiz va fayllaringiz butunlay tozalanadi.
              </p>
              <DeleteAccountButton />
            </CardContent>
          </Card>
        </div>

        {/* Right: Avatar Card */}
        <div className="col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-indigo-600/30">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-100">{user.name}</h3>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
                <div className="w-full flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700 mt-4">
                  <div className="flex items-center text-sm font-medium text-slate-300">
                    <Shield className="h-4 w-4 mr-2 text-emerald-500" />
                    Parol
                  </div>
                  <span className="text-xs text-slate-500">••••••••</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
