'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowRight,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  originalFileUrl: string;
  configuration: any;
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/templates');
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data);
      } else {
        setError(json.error?.message || 'Shablonlarni yuklashda xatolik yuz berdi');
      }
    } catch (err) {
      setError('Server bilan bog‘lanishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham ushbu shablonni o‘chirmoqchimisiz?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert(json.error?.message || 'Shablonni o‘chirishda xatolik yuz berdi');
      }
    } catch (err) {
      alert('Tarmoq xatoligi yuz berdi');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-white dark:to-slate-350 bg-clip-text text-transparent">
            Sertifikat Shablonlari
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Mavjud PDF sertifikat shablonlarini sozlang yoki yangi shablon yuklang.
          </p>
        </div>
        <Link href="/templates/new">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Yangi Shablon</span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-250 rounded-xl flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-650 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Shablonlar yuklanmoqda...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-3xl space-y-4 bg-white/40">
          <div className="p-4 bg-indigo-50 text-indigo-650 rounded-2xl">
            <FileCheck className="h-10 w-10" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-md font-bold text-slate-800">Shablonlar topilmadi</h3>
            <p className="text-slate-500 text-xs mt-1">
              Hozircha tizimda hech qanday shablon yaratilmagan. Boshlash uchun yangi shablon yarating.
            </p>
          </div>
          <Link href="/templates/new">
            <Button size="sm">Yangi Shablon yuklash</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center space-x-2 text-indigo-650 font-semibold text-xs uppercase tracking-wider mb-2">
                    <FileCheck className="h-4 w-4" />
                    <span>PDF Template</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1">{tpl.name}</h3>
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2 min-h-[2.5rem]">
                    {tpl.description || 'Tavsif kiritilmagan.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>
                      {new Date(tpl.createdAt).toLocaleDateString('uz-UZ', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className="bg-indigo-50 text-indigo-750 dark:bg-indigo-950 dark:text-indigo-400 px-2.5 py-1 rounded-full font-bold">
                    V1
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Link href={`/templates/${tpl.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full justify-center">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Tahrirlash
                    </Button>
                  </Link>
                  <Link href={`/generate?templateId=${tpl.id}`} className="flex-1">
                    <Button size="sm" className="w-full justify-center">
                      Tanlash
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    className="p-2.5"
                    onClick={() => handleDelete(tpl.id)}
                    disabled={deletingId === tpl.id}
                  >
                    {deletingId === tpl.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
