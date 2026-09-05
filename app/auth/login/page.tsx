'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NextLink from 'next/link';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';

type AuthMode = 'login' | 'forgot_email' | 'forgot_code' | 'forgot_new_password';

export default function LoginPage() {
  const router = useRouter();

  // Mode & attempts
  const [mode, setMode] = useState<AuthMode>('login');
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Password reset states
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback states
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (result?.error) {
        setFailedAttempts((prev) => prev + 1);
        setError('Email yoki parol xato kiritildi');
      } else {
        setFailedAttempts(0);
        router.push('/templates');
        router.refresh();
      }
    } catch (err) {
      setError('Tizimga kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Forgot Password - Send Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Tasdiqlash kodini yuborishda xatolik');
      } else {
        setSuccessMsg(data.message || 'Tasdiqlash kodi emailingizga yuborildi');
        setMode('forgot_code');
      }
    } catch (err) {
      setError('Server bilan aloqa yo\'q');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Kod noto\'g\'ri');
      } else {
        setSuccessMsg('Kod tasdiqlandi. Endi yangi parolingizni belgilang.');
        setMode('forgot_new_password');
      }
    } catch (err) {
      setError('Server bilan aloqa yo\'q');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setError('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yangi parollar bir-biriga mos kelmadi');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Parolni yangilashda xatolik');
      } else {
        setSuccessMsg('Parolingiz muvaffaqiyatli yangilandi! Endi yangi parol bilan tizimga kiring.');
        setEmail(resetEmail);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setResetCode('');
        setFailedAttempts(0);
        setMode('login');
      }
    } catch (err) {
      setError('Server bilan aloqa yo\'q');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
        {/* Header based on Mode */}
        {mode === 'login' && (
          <CardHeader className="space-y-2 border-b border-slate-800/80">
            <CardTitle className="text-3xl font-extrabold text-center bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              Tizimga kirish
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              Sertifikatlar platformasiga xush kelibsiz
            </CardDescription>
          </CardHeader>
        )}

        {mode === 'forgot_email' && (
          <CardHeader className="space-y-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2 text-indigo-400 mb-1">
              <Mail className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">1-qadam: Email tasdiqlash</span>
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-100">
              Parolni tiklash
            </CardTitle>
            <CardDescription className="text-slate-400">
              Profilingizga biriktirilgan email manzilini kiriting. Biz sizga tasdiqlash kodini yuboramiz.
            </CardDescription>
          </CardHeader>
        )}

        {mode === 'forgot_code' && (
          <CardHeader className="space-y-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2 text-indigo-400 mb-1">
              <KeyRound className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">2-qadam: Kodni kiritish</span>
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-100">
              Tasdiqlash kodi
            </CardTitle>
            <CardDescription className="text-slate-400">
              <strong className="text-slate-200">{resetEmail}</strong> manziliga 6 xonali kod yuborildi. Kodni quyida kiriting.
            </CardDescription>
          </CardHeader>
        )}

        {mode === 'forgot_new_password' && (
          <CardHeader className="space-y-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2 text-emerald-400 mb-1">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">3-qadam: Yangi parol</span>
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-100">
              Yangi parol o'rnatish
            </CardTitle>
            <CardDescription className="text-slate-400">
              Ikkala maydonga ham yangi parolingizni kiriting va tasdiqlang.
            </CardDescription>
          </CardHeader>
        )}

        {/* Global Notifications */}
        <div className="px-6 pt-6">
          {error && (
            <div className="p-3 bg-rose-950/50 text-rose-300 border border-rose-800/80 rounded-xl flex items-center space-x-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/50 text-emerald-300 border border-emerald-800/80 rounded-xl flex items-center space-x-2 text-sm mt-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}
        </div>

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-4">
              <Input
                label="Email manzili"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
              />

              <div className="space-y-1">
                <Input
                  label="Parol"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />

                {/* Parolni esingizdan chiqardingizmi? — Show when failed attempts >= 1 */}
                {failedAttempts >= 1 && (
                  <div className="pt-1.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_email');
                        setResetEmail(email);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors flex items-center space-x-1"
                    >
                      <KeyRound className="h-3 w-3 inline mr-1" />
                      <span>Parolni esingizdan chiqardingizmi?</span>
                    </button>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-slate-800/60">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Kirish
              </Button>

              <p className="text-sm text-center text-slate-400">
                Akkauntingiz yo'qmi?{' '}
                <NextLink href="/auth/register" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                  Ro'yxatdan o'tish
                </NextLink>
              </p>
            </CardFooter>
          </form>
        )}

        {/* 2. FORGOT PASSWORD - STEP 1: ENTER EMAIL */}
        {mode === 'forgot_email' && (
          <form onSubmit={handleSendCode}>
            <CardContent className="space-y-4 pt-4">
              <Input
                label="Email manzili"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="misol@gmail.com"
                disabled={loading}
              />
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-4 border-t border-slate-800/60">
              <Button type="submit" className="w-full" disabled={loading || !resetEmail}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Kodni yuborish
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center space-x-1 py-1"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Kirish oynasiga qaytish</span>
              </button>
            </CardFooter>
          </form>
        )}

        {/* 3. FORGOT PASSWORD - STEP 2: ENTER CODE */}
        {mode === 'forgot_code' && (
          <form onSubmit={handleVerifyCode}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Tasdiqlash kodi (6 xonali)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  disabled={loading}
                  className="w-full h-12 text-center font-mono text-2xl tracking-[0.4em] rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-600"
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Kod kelmadimi?</span>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                >
                  Qayta yuborish
                </button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-4 border-t border-slate-800/60">
              <Button type="submit" className="w-full" disabled={loading || resetCode.length < 6}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Kodni tasdiqlash
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode('forgot_email');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center space-x-1 py-1"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Emailni o'zgartirish</span>
              </button>
            </CardFooter>
          </form>
        )}

        {/* 4. FORGOT PASSWORD - STEP 3: NEW PASSWORD */}
        {mode === 'forgot_new_password' && (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4 pt-4">
              <Input
                label="Yangi parol"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                disabled={loading}
              />

              <Input
                label="Yangi parolni qayta tering"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Parolni tasdiqlang"
                disabled={loading}
              />
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-4 border-t border-slate-800/60">
              <Button type="submit" className="w-full" disabled={loading || !newPassword || !confirmPassword}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Parolni yangilash va saqlash
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center space-x-1 py-1"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Bekor qilish</span>
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
