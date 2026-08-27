'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FileText,
  Clock,
  Trash2
} from 'lucide-react';

interface Certificate {
  id: string;
  fullName: string;
  certificateId: string;
  status: string;
  errorMessage: string | null;
  region: string | null; // Added region (hudud)
  sourceRow: number;
}

interface GenerationDetail {
  id: string;
  templateName: string;
  sourceFileName: string;
  sourceType: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  status: string;
  zipFileUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  certificates: Certificate[];
}

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [batch, setBatch] = useState<GenerationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm('Haqiqatan ham ushbu generatsiya partiyasi (batch) va uning barcha sertifikatlarini o‘chirmoqchimisiz?')) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/generate/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        router.push('/history');
      } else {
        alert(json.error?.message || 'O‘chirishda xatolik yuz berdi.');
      }
    } catch (err) {
      alert('Baza bilan aloqa xatoligi yuz berdi.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCertificate = async (certId: string) => {
    if (!confirm('Haqiqatan ham ushbu qatnashchi sertifikatini o‘chirmoqchimisiz?')) return;
    try {
      setDeletingCertId(certId);
      const res = await fetch(`/api/certificates/${certId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setBatch((prev) => {
          if (!prev) return null;
          const cert = prev.certificates.find((c) => c.id === certId);
          const isSuccess = cert?.status === 'GENERATED';
          return {
            ...prev,
            totalRows: prev.totalRows - 1,
            successCount: isSuccess ? prev.successCount - 1 : prev.successCount,
            failedCount: !isSuccess ? prev.failedCount - 1 : prev.failedCount,
            certificates: prev.certificates.filter((c) => c.id !== certId),
          };
        });
      } else {
        alert(json.error?.message || 'O‘chirishda xatolik yuz berdi.');
      }
    } catch (err) {
      alert('Baza bilan aloqa xatoligi yuz berdi.');
    } finally {
      setDeletingCertId(null);
    }
  };

  const fetchBatchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/generate/${id}`);
      const json = await res.json();
      if (json.success) {
        setBatch(json.data);
      } else {
        setError(json.error?.message || 'Tafsilotlarni yuklashda xatolik.');
      }
    } catch (err) {
      setError('Serverga ulanish xatoligi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBatchDetail();
    }
  }, [id]);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Back button */}
      <div>
        <NextLink
          href="/history"
          className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tarix ro‘yxatiga qaytish</span>
        </NextLink>
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
          <p className="text-sm text-slate-500 font-medium">Batch tafsilotlari yuklanmoqda...</p>
        </div>
      ) : !batch ? (
        <div className="p-6 text-center text-slate-550">Ma‘lumot topilmadi.</div>
      ) : (
        <div className="space-y-8">
          {/* Main Batch Details Card */}
          <Card className="shadow-xl">
            <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-indigo-650 uppercase tracking-widest">Generation batch</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">
                    CERT-{batch.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <CardTitle className="text-2xl font-extrabold text-slate-900 mt-1">
                  {batch.templateName || 'O‘chirilgan shablon'}
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-0.5">
                  Fayl: <span className="font-semibold">{batch.sourceFileName}</span>
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                {batch.zipFileUrl && (
                  <a href={`/api/generate/${batch.id}/download?type=zip`} download>
                    <Button size="sm" className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>ZIP Yuklab olish</span>
                    </Button>
                  </a>
                )}
                {batch.failedCount > 0 && (
                  <a href={`/api/generate/${batch.id}/download?type=error`} download>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2 text-rose-700 border-rose-250 hover:bg-rose-50">
                      <AlertCircle className="h-4 w-4" />
                      <span>Xatolar hisoboti</span>
                    </Button>
                  </a>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>O‘chirish</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Grid stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Holati</span>
                  <div className="mt-1.5">
                    {batch.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-850 border border-emerald-100">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Muvaffaqiyatli</span>
                      </span>
                    ) : batch.status === 'COMPLETED_WITH_ERRORS' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-850 border border-amber-100">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        <span>Xatolar bilan</span>
                      </span>
                    ) : batch.status === 'PROCESSING' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-850 border border-indigo-100">
                        <Loader2 className="h-3 w-3 animate-spin text-indigo-650" />
                        <span>Ishlanmoqda</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-850 border border-rose-100">
                        <AlertCircle className="h-3 w-3 text-rose-600" />
                        <span>Xatolik</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jami Qatorlar</span>
                  <span className="text-xl font-bold text-slate-800 mt-1 block">{batch.totalRows} ta</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Muvaffaqiyatli</span>
                  <span className="text-xl font-bold text-emerald-600 mt-1 block">{batch.successCount} ta</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Xatolik</span>
                  <span className="text-xl font-bold text-rose-600 mt-1 block">{batch.failedCount} ta</span>
                </div>
              </div>

              {/* Time stats */}
              <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-slate-100 text-xs text-slate-450 font-semibold">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-slate-400" />
                  Boshlandi: {new Date(batch.createdAt).toLocaleString('uz-UZ')}
                </span>
                {batch.completedAt && (
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1.5 text-slate-400" />
                    Yakunlandi: {new Date(batch.completedAt).toLocaleString('uz-UZ')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Individual records list */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">
              Qabul Qiluvchilar Ro‘yxati ({batch.certificates.length})
            </h3>

            <Card className="shadow-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Qator</TableHead>
                    <TableHead>F.I.Sh</TableHead>
                    <TableHead>Sertifikat ID</TableHead>
                    <TableHead>Hudud (Region)</TableHead>
                    <TableHead>Holati</TableHead>
                    <TableHead>Tafsilotlar (Xatoliklar)</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-semibold text-slate-500 dark:text-slate-400">
                        {cert.sourceRow}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                        {cert.fullName}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-350 bg-slate-100/40 dark:bg-slate-800/40 px-2 py-0.5 border border-slate-200/50 dark:border-slate-700/50 rounded w-fit">
                        {cert.certificateId}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 text-sm font-semibold">
                        {cert.region || '-'}
                      </TableCell>
                      <TableCell>
                        {cert.status === 'GENERATED' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-850 border border-emerald-100">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Yaratildi</span>
                          </span>
                        ) : cert.status === 'FAILED' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-850 border border-rose-100">
                            <AlertCircle className="h-3 w-3 text-rose-600" />
                            <span>Xatolik</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                            <span>Kutilmoqda</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-550 text-xs font-semibold">
                        {cert.status === 'FAILED' ? (
                          <span className="text-rose-650">{cert.errorMessage || 'Tafsilotlar yo‘q'}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Muvaffaqiyatli yaratildi</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="xs"
                          variant="danger"
                          className="p-1.5"
                          onClick={() => handleDeleteCertificate(cert.id)}
                          disabled={deletingCertId === cert.id}
                          title="Sertifikatni o‘chirish"
                        >
                          {deletingCertId === cert.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
