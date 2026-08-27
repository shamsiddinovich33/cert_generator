'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/router'; // wait, for App Router we should use next/navigation for router and Link from next/link!
import NextLink from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileCheck, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Faqat PDF formatidagi shablonlar qabul qilinadi.');
        setFile(null);
      } else {
        setError(null);
        setFile(selectedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Shablon nomini kiriting.');
      return;
    }
    if (!file) {
      setError('Sertifikat PDF shablonini yuklang.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('file', file);

      const res = await fetch('/api/templates', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        // Redirect to configuration editor
        router.push(`/templates/${json.data.id}`);
      } else {
        setError(json.error?.message || 'Shablonni saqlashda xatolik yuz berdi');
      }
    } catch (err) {
      setError('Server bilan bog‘lanishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto w-full space-y-6">
      {/* Back button */}
      <div>
        <NextLink
          href="/templates"
          className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Barcha shablonlarga qaytish</span>
        </NextLink>
      </div>

      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold text-slate-900">
            Yangi Shablon Yuklash
          </CardTitle>
          <CardDescription className="text-slate-550 font-medium">
            Sertifikat shabloni uchun asosiy ma'lumotlarni kiriting va PDF shablon faylini biriktiring.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-250 rounded-xl flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Shablon nomi"
                placeholder="Masalan: Certificate 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Tavsif (Description)
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                  placeholder="2026-yilgi yakuniy sertifikat shabloni haqida..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Drag and drop Area */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  PDF Shablon Fayli
                </label>
                
                <div className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all ${
                  file ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-400'
                }`}>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  
                  {file ? (
                    <div className="space-y-3">
                      <div className="mx-auto p-3 bg-indigo-100 text-indigo-750 rounded-2xl w-fit">
                        <FileCheck className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <label htmlFor="file-upload" className="cursor-pointer inline-flex text-xs font-bold text-indigo-650 hover:underline">
                        Boshqa fayl tanlash
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="file-upload" className="cursor-pointer space-y-3">
                      <div className="mx-auto p-3 bg-slate-100 text-slate-500 rounded-2xl w-fit">
                        <UploadCloud className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Sertifikat PDF faylini biriktirish uchun bosing
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Faqat PDF formatda, maksimal 20 MB
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800/60 pt-6">
            <NextLink href="/templates">
              <Button type="button" variant="outline" disabled={loading}>
                Bekor qilish
              </Button>
            </NextLink>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yuklanmoqda...
                </>
              ) : (
                'Davom etish (Editor)'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
