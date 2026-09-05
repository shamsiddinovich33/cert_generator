'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
  Award, 
  Download, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Search,
  ExternalLink,
  Trash2
} from 'lucide-react';
import NextLink from 'next/link';

interface Certificate {
  id: string;
  generationId: string;
  fullName: string;
  certificateId: string;
  region: string | null; // Added region (hudud)
  fileName: string;
  fileUrl: string | null;
  status: string; // PENDING, GENERATED, FAILED
  errorMessage: string | null;
  createdAt: string;
  generation: {
    templateName: string;
    sourceFileName: string;
  };
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham ushbu sertifikatni o‘chirmoqchimisiz?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setCertificates((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(json.error?.message || 'O‘chirishda xatolik yuz berdi.');
      }
    } catch (err) {
      alert('Baza bilan aloqa xatoligi yuz berdi.');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/certificates');
      const json = await res.json();
      if (json.success) {
        setCertificates(json.data);
      } else {
        setError(json.error?.message || 'Sertifikatlarni yuklashda xatolik yuz berdi.');
      }
    } catch (err) {
      setError('Serverga ulanib bo‘lmadi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const filteredCerts = certificates.filter(
    (cert) =>
      cert.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cert.region && cert.region.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cert.generation?.templateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Yaratilgan Sertifikatlar
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Barcha muvaffaqiyatli va xatolik bilan tugatilgan sertifikatlar ro‘yxati.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center space-x-3 w-full max-w-md bg-white rounded-xl border border-slate-200 px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-500">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Ism, sertifikat ID yoki shablon nomi bo‘yicha izlash..."
          className="w-full text-sm bg-transparent outline-none border-none placeholder:text-slate-450 text-slate-900"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-white/40 rounded-3xl border border-dashed border-slate-200">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Sertifikatlar yuklanmoqda...</p>
        </div>
      ) : filteredCerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-3xl space-y-4 bg-white/40">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Award className="h-10 w-10" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-md font-bold text-slate-800">Sertifikatlar topilmadi</h3>
            <p className="text-slate-500 text-xs mt-1">
              {searchQuery ? 'Qidiruv so‘rovingiz bo‘yicha sertifikatlar topilmadi.' : 'Sertifikatlar yaratilmagan. Boshlash uchun Generate sahifasiga o‘ting.'}
            </p>
          </div>
        </div>
      ) : (
        <Card className="shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Qabul qiluvchi (F.I.Sh)</TableHead>
                  <TableHead>Sertifikat ID</TableHead>
                  <TableHead>Hudud (Region)</TableHead>
                  <TableHead>Shablon nomi</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Holati</TableHead>
                  <TableHead className="text-right">Fayl</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                      {cert.fullName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded w-fit border border-slate-200/40 dark:border-slate-700/40">
                      {cert.certificateId}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 text-sm font-semibold">
                      {cert.region || '-'}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 font-medium">
                      {cert.generation?.templateName || 'O‘chirilgan shablon'}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(cert.createdAt).toLocaleDateString('uz-UZ', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      {cert.status === 'GENERATED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-850 border border-emerald-100">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Yaratilgan</span>
                        </span>
                      ) : cert.status === 'FAILED' ? (
                        <span
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-850 border border-rose-100 cursor-help"
                          title={cert.errorMessage || ''}
                        >
                          <AlertCircle className="h-3 w-3 text-rose-600" />
                          <span>Xato</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Kutilmoqda</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {cert.status === 'GENERATED' ? (
                          <div className="flex space-x-2">
                            <a href={`/api/certificates/${cert.id}/download`} target="_blank" rel="noreferrer">
                              <Button size="xs" variant="primary" className="text-xs bg-indigo-600 hover:bg-indigo-700">
                                PDF
                              </Button>
                            </a>
                            <NextLink href={`/history/${cert.generationId}`}>
                              <Button size="xs" variant="outline" className="text-xs">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                Batch
                              </Button>
                            </NextLink>
                          </div>
                        ) : cert.status === 'FAILED' ? (
                          <span className="text-xs text-rose-500 font-medium line-clamp-1 max-w-[12rem] cursor-help" title={cert.errorMessage || ''}>
                            {cert.errorMessage}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-450">-</span>
                        )}
                        
                        <Button
                          size="xs"
                          variant="danger"
                          className="p-2"
                          onClick={() => handleDelete(cert.id)}
                          disabled={deletingId === cert.id}
                          title="Sertifikatni o‘chirish"
                        >
                          {deletingId === cert.id ? (
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
