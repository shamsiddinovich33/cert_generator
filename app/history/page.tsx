'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
  History, 
  Eye, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Download,
  Database,
  Trash2
} from 'lucide-react';

interface Generation {
  id: string;
  templateId: string | null;
  templateName: string;
  sourceType: string;
  sourceFileName: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  status: string; // PENDING, PROCESSING, COMPLETED, COMPLETED_WITH_ERRORS, FAILED
  zipFileUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham ushbu generatsiya partiyasi (batch) va uning barcha sertifikatlarini o‘chirmoqchimisiz?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/generate/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setGenerations((prev) => prev.filter((g) => g.id !== id));
      } else {
        alert(json.error?.message || 'O‘chirishda xatolik yuz berdi.');
      }
    } catch (err) {
      alert('Baza bilan aloqa xatoligi yuz berdi.');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/generate');
      const json = await res.json();
      if (json.success) {
        setGenerations(json.data);
      } else {
        setError(json.error?.message || 'Tarix ma’lumotlarini yuklashda xatolik.');
      }
    } catch (err) {
      setError('Serverga ulanib bo‘lmadi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Generatsiya Tarixi
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Barcha oldingi sertifikat yaratish jarayonlari (batchlar) va ularning holati.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-white/40 rounded-3xl border border-dashed border-slate-200">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Generatsiya tarixi yuklanmoqda...</p>
        </div>
      ) : generations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-3xl space-y-4 bg-white/40">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <History className="h-10 w-10" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-md font-bold text-slate-800">Tarix bo‘sh</h3>
            <p className="text-slate-500 text-xs mt-1">
              Hozircha hech qanday sertifikat generatsiya qilinmagan.
            </p>
          </div>
        </div>
      ) : (
        <Card className="shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Shablon nomi</TableHead>
                  <TableHead>Fayl nomi</TableHead>
                  <TableHead className="text-center">Jami</TableHead>
                  <TableHead className="text-center">Muvaffaqiyatli</TableHead>
                  <TableHead className="text-center">Xato</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generations.map((gen) => (
                  <TableRow key={gen.id}>
                    <TableCell className="font-mono text-xs text-slate-850 font-bold">
                      CERT-{gen.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800">
                      {gen.templateName || 'O‘chirilgan shablon'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs truncate max-w-[10rem]" title={gen.sourceFileName}>
                      {gen.sourceFileName}
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-800">
                      {gen.totalRows}
                    </TableCell>
                    <TableCell className="text-center font-bold text-emerald-600">
                      {gen.successCount}
                    </TableCell>
                    <TableCell className="text-center font-bold text-rose-600">
                      {gen.failedCount}
                    </TableCell>
                    <TableCell>
                      {gen.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-850 border border-emerald-100">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Bajarildi</span>
                        </span>
                      ) : gen.status === 'COMPLETED_WITH_ERRORS' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-850 border border-amber-100">
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                          <span>Xato bilan tugadi</span>
                        </span>
                      ) : gen.status === 'PROCESSING' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-850 border border-indigo-100">
                          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                          <span>Ishlanmoqda</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-850 border border-rose-100">
                          <AlertCircle className="h-3 w-3 text-rose-600" />
                          <span>Xatolik</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-550 text-xs">
                      {new Date(gen.createdAt).toLocaleDateString('uz-UZ', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {gen.zipFileUrl && (
                          <a href={`/api/generate/${gen.id}/download?type=zip`} download>
                            <Button size="xs" variant="outline" className="p-2" title="ZIP yuklab olish">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                        <NextLink href={`/history/${gen.id}`}>
                          <Button size="xs" className="flex items-center space-x-1">
                            <Eye className="h-3.5 w-3.5" />
                            <span>Batafsil</span>
                          </Button>
                        </NextLink>
                        <Button
                          size="xs"
                          variant="danger"
                          className="p-2"
                          onClick={() => handleDelete(gen.id)}
                          disabled={deletingId === gen.id}
                          title="O‘chirish"
                        >
                          {deletingId === gen.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
