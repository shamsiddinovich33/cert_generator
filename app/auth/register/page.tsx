'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NextLink from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
        setLoading(false);
        return;
      }

      // Automatically log in after registration
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Avtomatik kirish amalga oshmadi. Iltimos login orqali kiring.');
        setLoading(false);
      } else {
        router.push('/templates');
        router.refresh();
      }
    } catch (err) {
      setError('Tizim bilan bog\'lanishda xatolik');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
        <CardHeader className="space-y-2 border-b border-slate-800/80">
          <CardTitle className="text-3xl font-extrabold text-center bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Ro'yxatdan o'tish
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            Platformada o'z profilingizni yarating
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <div className="p-3 bg-rose-950/50 text-rose-300 border border-rose-800/80 rounded-xl flex items-center space-x-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <p className="font-medium">{error}</p>
              </div>
            )}
            
            <Input
              label="F.I.Sh yoki Tashkilot nomi"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Asadbek"
              disabled={loading}
            />

            <Input
              label="Email manzili"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
            />
            
            <Input
              label="Parol"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 belgi"
              disabled={loading}
              minLength={6}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-slate-800/60">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Ro'yxatdan o'tish
            </Button>
            
            <p className="text-sm text-center text-slate-400">
              Avval ro'yxatdan o'tganmisiz?{' '}
              <NextLink href="/auth/login" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                Tizimga kirish
              </NextLink>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
