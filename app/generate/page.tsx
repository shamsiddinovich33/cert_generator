'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
  FileCheck, 
  UploadCloud, 
  Settings, 
  CheckCircle2, 
  Eye, 
  Play, 
  Download, 
  Loader2, 
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ParticipantInput, RowError } from '@/types';
import { validateExcelRows } from '@/lib/excel/validator';

interface Template {
  id: string;
  name: string;
  description: string | null;
  configuration?: any;
}

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Wizard Steps: 1 to 7
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Excel states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [excelRows, setExcelRows] = useState<Record<string, string>[]>([]);
  const [totalExcelRows, setTotalExcelRows] = useState(0);

  // Column mapping states
  const [fullNameCol, setFullNameCol] = useState('');
  const [certificateIdCol, setCertificateIdCol] = useState('');
  const [regionCol, setRegionCol] = useState('');
  const [dynamicCols, setDynamicCols] = useState<Record<string, string>>({});

  // Validation results
  const [validParticipants, setValidParticipants] = useState<ParticipantInput[]>([]);
  const [invalidRows, setInvalidRows] = useState<RowError[]>([]);

  // Preview states
  const [previewParticipantIndex, setPreviewParticipantIndex] = useState(0);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');

  // Background Job states
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('PENDING');
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  // 1. Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/templates');
        const json = await res.json();
        if (json.success) {
          setTemplates(json.data);
          // Set selection from search params or default to first template
          const paramId = searchParams.get('templateId');
          if (paramId && json.data.some((t: Template) => t.id === paramId)) {
            setSelectedTemplateId(paramId);
          } else if (json.data.length > 0) {
            setSelectedTemplateId(json.data[0].id);
          }
        } else {
          setError(json.error?.message || 'Shablonlarni yuklashda xatolik.');
        }
      } catch (err) {
        setError('Serverga ulanib bo‘lmadi.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [searchParams]);

  // 2. Parse Excel file whenever file or sheet name changes
  const handleExcelUpload = async (file: File, sheet?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      if (sheet) {
        formData.append('sheetName', sheet);
      }

      const res = await fetch('/api/excel', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setExcelFile(file);
        setSheetNames(json.data.sheetNames);
        if (!sheet) {
          setSelectedSheetName(json.data.sheetNames[0]);
        }
        setExcelColumns(json.data.columns);
        setExcelRows(json.data.previewRows); // 50 preview rows
        setTotalExcelRows(json.data.totalRows);

        // Pre-select smart mappings if names match
        const cols = json.data.columns as string[];
        const nameMatch = cols.find(c => {
          const lower = c.toLowerCase();
          return lower.includes('ism') || lower.includes('name') || lower.includes('f.i.sh') || lower.includes('fullname') || lower.includes('fish') || lower.includes('familiya') || lower.includes('ism') || lower === 'fio' || lower === 'f.i.o';
        });
        const idMatch = cols.find(c => {
          const lower = c.toLowerCase();
          return lower.includes('id') || lower.includes('kod') || lower.includes('code') || lower.includes('sertifikat') || lower.includes('raqam') || lower.includes('nomer');
        });
        const regionMatch = cols.find(c => {
          const lower = c.toLowerCase();
          return lower.includes('hudud') || lower.includes('region') || lower.includes('viloyat') || lower.includes('tuman') || lower.includes('shahar');
        });

        // Smart fallback: avoid assigning the same column to both name and ID
        let resolvedNameCol = nameMatch || '';
        let resolvedIdCol = idMatch || '';
        
        if (!resolvedNameCol && resolvedIdCol) {
          // Name not found, pick first column that's not the ID column
          resolvedNameCol = cols.find(c => c !== resolvedIdCol) || cols[0] || '';
        } else if (!resolvedNameCol && !resolvedIdCol) {
          resolvedNameCol = cols[0] || '';
          resolvedIdCol = cols[1] || cols[0] || '';
        }
        
        // If both ended up on the same column, try to separate them
        if (resolvedNameCol === resolvedIdCol && cols.length > 1) {
          resolvedNameCol = cols.find(c => c !== resolvedIdCol) || cols[0];
        }

        setFullNameCol(resolvedNameCol);
        setCertificateIdCol(resolvedIdCol);
        setRegionCol(regionMatch || '');
      } else {
        setError(json.error?.message || 'Excel tahlil qilishda xatolik.');
      }
    } catch (err) {
      setError('Excel yuklashda server xatoligi yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleExcelUpload(e.target.files[0]);
    }
  };

  const handleGoogleSheetsUrl = async (url: string) => {
    try {
      setLoading(true);
      setError(null);
      // Example url: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error('Noto\'g\'ri Google Sheets ssilkasi. Iltimos, to\'g\'ri ssilkani kiriting.');
      }
      const sheetId = match[1];
      let gid = '0';
      if (url.includes('gid=')) {
        gid = url.split('gid=')[1].split('&')[0];
      }
      
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      const res = await fetch(exportUrl);
      if (!res.ok) {
        throw new Error('Google Sheets fayliga kirish imkoni yo\'q. U ommaviy ochiq (Anyone with the link) ekanligini tekshiring.');
      }
      
      // Fetch text and prepend UTF-8 BOM to fix Cyrillic/Uzbek Latin characters encoding
      const text = await res.text();
      const blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8;' });
      const file = new File([blob], 'GoogleSheets_Export.csv', { type: 'text/csv' });
      await handleExcelUpload(file);
    } catch (err: any) {
      setError(err.message || 'Google Sheets ulanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSheetName(val);
    if (excelFile) {
      handleExcelUpload(excelFile, val);
    }
  };

  // 3. Process Validation
  const processValidation = () => {
    const activeTemplate = templates.find(t => t.id === selectedTemplateId);
    const activeFields = activeTemplate?.configuration?.fields || [];
    
    const requiresFullName = activeFields.some((f: any) => f.key === 'fullName');
    const requiresCertId = activeFields.some((f: any) => f.key === 'certificateId');
    const dynamicFields = activeFields.filter((f: any) => f.key !== 'fullName' && f.key !== 'certificateId');
    
    if (requiresFullName && !fullNameCol) {
      setError('Ism ustunini tanlang.');
      return;
    }
    if (requiresCertId && !certificateIdCol) {
      setError('ID ustunini tanlang.');
      return;
    }
    
    const missingDynamic = dynamicFields.some((f: any) => !dynamicCols[f.key]);
    if (missingDynamic) {
      setError('Barcha qo\'shimcha maydonlarni tanlang.');
      return;
    }

    if (excelRows.length === 0) {
      setError('Excel ma\'lumotlari bo\'sh.');
      return;
    }

    setLoading(true);
    
    console.log('[DEBUG] Column mapping:', { fullNameCol, certificateIdCol, regionCol, dynamicCols });
    console.log('[DEBUG] First Excel row:', excelRows[0]);
    console.log('[DEBUG] Excel columns:', excelColumns);
    
    const result = validateExcelRows(excelRows, {
      fullNameColumn: fullNameCol,
      certificateIdColumn: certificateIdCol,
      regionColumn: regionCol || undefined,
      dynamicColumns: dynamicCols,
    });

    console.log('[DEBUG] First valid participant:', result.valid[0]);

    if (result.valid.length > 100) {
      setError(`Sizning ro'yxatingizda ${result.valid.length} kishi qatnashyapti. Tizim cheklovi bo'yicha bir urinishda maksimal 100 ta sertifikat generatsiya qilish mumkin. Iltimos, ro'yxatni qisqartiring.`);
      setLoading(false);
      return;
    }

    setValidParticipants(result.valid);
    setInvalidRows(result.invalid);
    setLoading(false);
    setStep(4);
  };

  // 4. Load Single Preview PDF
  const loadPreviewPdf = async (index: number) => {
    const participant = validParticipants[index];
    if (!participant) return;

    try {
      setPreviewLoading(true);
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
      setPreviewPdfUrl(null);

      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          fullName: participant.fullName,
          certificateId: participant.certificateId,
          dynamicFields: participant.dynamicFields || {},
        }),
      });

      if (!res.ok) {
        throw new Error('Sertifikat preview xatoligi');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (step === 5 && validParticipants.length > 0) {
      loadPreviewPdf(previewParticipantIndex);
    }
  }, [step, previewParticipantIndex]);

  // 5. Start Generation Job
  const handleStartGeneration = async () => {
    try {
      setLoading(true);
      setError(null);
      setStep(6);

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          sourceFileName: excelFile?.name || 'participants.xlsx',
          mapping: {
            fullName: fullNameCol,
            certificateId: certificateIdCol,
            region: regionCol,
          },
          participants: validParticipants,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setGenerationId(json.data.generationId);
        setGenerationStatus(json.data.status);
        setSuccessCount(0);
        setFailedCount(0);
      } else {
        setError(json.error?.message || 'Generatsiyani boshlashda xatolik.');
        setStep(5);
      }
    } catch (err) {
      setError('Server xatoligi yuz berdi.');
      setStep(5);
    } finally {
      setLoading(false);
    }
  };

  // 6. Poll background job progress
  useEffect(() => {
    if (!generationId || generationStatus === 'COMPLETED' || generationStatus === 'COMPLETED_WITH_ERRORS' || generationStatus === 'FAILED') {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate/${generationId}`);
        const json = await res.json();
        
        if (json.success) {
          const gen = json.data;
          setGenerationStatus(gen.status);
          setSuccessCount(gen.successCount);
          setFailedCount(gen.failedCount);
          setZipUrl(gen.zipFileUrl);

          if (gen.status === 'COMPLETED' || gen.status === 'COMPLETED_WITH_ERRORS' || gen.status === 'FAILED') {
            clearInterval(intervalId);
            setStep(7);
          }
        }
      } catch (err) {
        console.error('Error polling generation progress:', err);
      }
    }, 1500);

    return () => clearInterval(intervalId);
  }, [generationId, generationStatus]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  const totalProcessed = successCount + failedCount;
  const progressPercent = validParticipants.length > 0 ? (totalProcessed / validParticipants.length) * 100 : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          Sertifikatlar Yaratish (Wizard)
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Hujjatlar tayyorlash uchun 7 ta bosqichni ketma-ket bajaring.
        </p>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="grid grid-cols-7 gap-2 text-center shrink-0">
        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
          <div key={s} className="flex flex-col items-center space-y-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-350 ${
              step === s
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                : step > s
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-500'
            }`}>
              {s}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${
              step === s ? 'text-indigo-600' : step > s ? 'text-emerald-700' : 'text-slate-400'
            }`}>
              {s === 1 && 'Shablon'}
              {s === 2 && 'Excel'}
              {s === 3 && 'Mapping'}
              {s === 4 && 'Validation'}
              {s === 5 && 'Preview'}
              {s === 6 && 'Generate'}
              {s === 7 && 'Download'}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Wizard Step Containers */}

      {/* STEP 1: Select Template */}
      {step === 1 && (
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Shablonni Tanlang</CardTitle>
            <CardDescription>Generatsiya qilmoqchi bo‘lgan PDF sertifikat shabloningizni belgilang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-slate-500 text-sm">Tizimda sertifikat shablonlari topilmadi.</p>
                <Button size="sm" onClick={() => router.push('/templates/new')}>Shablon yuklash</Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Mavjud Shablonlar
                </label>
                <div className="relative">
                  <select
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 appearance-none"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end pt-6 border-t border-slate-100">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedTemplateId}
              className="flex items-center space-x-2"
            >
              <span>Keyingi qadam</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: Upload Excel */}
      {step === 2 && (
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Qatnashchilar Ro‘yxatini Yuklang</CardTitle>
            <CardDescription>Formatlar: .xlsx, .xls, .csv. Maksimal fayl hajmi: 20 MB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-10 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                id="excel-upload"
                className="hidden"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                disabled={loading}
              />
              
              {excelFile ? (
                <div className="space-y-4">
                  <div className="mx-auto p-3 bg-emerald-100 text-emerald-700 rounded-2xl w-fit">
                    <FileSpreadsheet className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{excelFile.name}</p>
                    <p className="text-xs text-slate-500">{(excelFile.size / 1024).toFixed(1)} KB | {totalExcelRows} ta qator</p>
                  </div>
                  
                  {sheetNames.length > 1 && (
                    <div className="max-w-xs mx-auto text-left space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Varaq (Sheet) tanlash</label>
                      <div className="relative">
                        <select
                          className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none appearance-none"
                          value={selectedSheetName}
                          onChange={handleSheetChange}
                        >
                          {sheetNames.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <label htmlFor="excel-upload" className="cursor-pointer inline-flex text-xs font-bold text-indigo-600 hover:underline">
                    Boshqa fayl yuklash
                  </label>
                </div>
              ) : (
                <label htmlFor="excel-upload" className="cursor-pointer space-y-3">
                  <div className="mx-auto p-3 bg-slate-100 text-slate-500 rounded-2xl w-fit">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Excel yoki CSV faylini biriktirish uchun bosing
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Fayl yuklangach, ustunlar va qatorlar tahlil qilinadi
                    </p>
                  </div>
                </label>
              )}
            </div>

            {!excelFile && (
              <>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200"></span>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-slate-500 uppercase font-bold tracking-wider">Yoki Google Sheets orqali</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                  />
                  <Button 
                    type="button"
                    onClick={() => handleGoogleSheetsUrl(sheetUrl)}
                    disabled={!sheetUrl || loading}
                    className="h-10"
                  >
                    Yuklash
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-6 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(1)} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Orqaga</span>
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!excelFile || loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Tahlil qilinmoqda...
                </>
              ) : (
                <>
                  <span>Keyingi qadam</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: Column Mapping */}
      {step === 3 && (
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Ustunlarni Bog‘lang (Column Mapping)</CardTitle>
            <CardDescription>Excel faylidagi ustunlarni sertifikat maydonlariga moslang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Full Name Column */}
              {(templates.find(t => t.id === selectedTemplateId)?.configuration?.fields || []).some((f: any) => f.key === 'fullName') && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Ism (Full Name) Ustuni
                  </label>
                  <div className="relative">
                    <select
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 appearance-none"
                      value={fullNameCol}
                      onChange={(e) => setFullNameCol(e.target.value)}
                    >
                      <option value="">-- Tanlanmagan --</option>
                      {excelColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Certificate ID Column */}
              {(templates.find(t => t.id === selectedTemplateId)?.configuration?.fields || []).some((f: any) => f.key === 'certificateId') && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Sertifikat ID Ustuni
                  </label>
                  <div className="relative">
                    <select
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 appearance-none"
                      value={certificateIdCol}
                      onChange={(e) => setCertificateIdCol(e.target.value)}
                    >
                      <option value="">-- Tanlanmagan --</option>
                      {excelColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Region Column */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Hudud (Region) Ustuni (Ixtiyoriy)
                </label>
                <div className="relative">
                  <select
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 appearance-none"
                    value={regionCol}
                    onChange={(e) => setRegionCol(e.target.value)}
                  >
                    <option value="">-- Tanlanmagan --</option>
                    {excelColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Fields from Template */}
            {(templates.find(t => t.id === selectedTemplateId)?.configuration?.fields || [])
              .filter((f: any) => f.key !== 'fullName' && f.key !== 'certificateId')
              .length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                {(templates.find(t => t.id === selectedTemplateId)?.configuration?.fields || [])
                  .filter((f: any) => f.key !== 'fullName' && f.key !== 'certificateId')
                  .map((field: any) => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        {field.label || field.key}
                      </label>
                      <div className="relative">
                        <select
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 appearance-none"
                          value={dynamicCols[field.key] || ''}
                          onChange={(e) => setDynamicCols(prev => ({ ...prev, [field.key]: e.target.value }))}
                        >
                          <option value="">-- Tanlanmagan --</option>
                          {excelColumns.map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Quick Preview table of parsed Excel */}
            {excelRows.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Excel Ma'lumotlari (Dastlabki qatorlar)</span>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* Fixed headers based on standard mapping */}
                      {(templates.find(t => t.id === selectedTemplateId)?.configuration?.fields || []).some((f: any) => f.key === 'fullName') && (
                        <TableHead>Ism (F.I.Sh)</TableHead>
                      )}
                      {(templates.find(t => t.id === selectedTemplateId)?.configuration?.fields || []).some((f: any) => f.key === 'certificateId') && (
                        <TableHead>ID</TableHead>
                      )}
                      <TableHead>Hudud (Region)</TableHead>
                      
                      {/* Dynamic field headers */}
                      {(templates.find(t => t.id === selectedTemplateId)?.configuration?.fields || [])
                        .filter((f: any) => f.key !== 'fullName' && f.key !== 'certificateId')
                        .map((field: any) => (
                          <TableHead key={field.key}>{field.label || field.key}</TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excelRows.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        {(templates.find(t => t.id === selectedTemplateId)?.configuration?.fields || []).some((f: any) => f.key === 'fullName') && (
                          <TableCell className="font-medium">{fullNameCol ? (row[fullNameCol] || '-') : '-'}</TableCell>
                        )}
                        {(templates.find(t => t.id === selectedTemplateId)?.configuration?.fields || []).some((f: any) => f.key === 'certificateId') && (
                          <TableCell>{certificateIdCol ? (row[certificateIdCol] || '-') : '-'}</TableCell>
                        )}
                        <TableCell>{regionCol ? (row[regionCol] || '-') : '-'}</TableCell>
                        
                        {(templates.find(t => t.id === selectedTemplateId)?.configuration?.fields || [])
                          .filter((f: any) => f.key !== 'fullName' && f.key !== 'certificateId')
                          .map((field: any) => (
                            <TableCell key={field.key}>
                              {dynamicCols[field.key] ? (row[dynamicCols[field.key]] || '-') : '-'}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-6 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(2)} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Orqaga</span>
            </Button>
            <Button
              onClick={processValidation}
              disabled={
                (() => {
                  const activeTemplate = templates.find(t => t.id === selectedTemplateId);
                  const activeFields = activeTemplate?.configuration?.fields || [];
                  const requiresFullName = activeFields.some((f: any) => f.key === 'fullName');
                  const requiresCertId = activeFields.some((f: any) => f.key === 'certificateId');
                  const dynamicFields = activeFields.filter((f: any) => f.key !== 'fullName' && f.key !== 'certificateId');
                  
                  if (requiresFullName && !fullNameCol) return true;
                  if (requiresCertId && !certificateIdCol) return true;
                  if (dynamicFields.some((f: any) => !dynamicCols[f.key])) return true;
                  
                  return false;
                })()
              }
              className="flex items-center space-x-2"
            >
              <span>Keyingi qadam (Tekshirish)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: Validate Data */}
      {step === 4 && (
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Ma’lumotlarni Tasdiqlash (Validation)</CardTitle>
            <CardDescription>Barcha ma'lumotlar formati va unikal IDlar tekshirildi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Jami qatorlar</span>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{totalExcelRows}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">To‘g‘ri (Valid)</span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">{validParticipants.length}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">Xatolar (Invalid)</span>
                <p className="text-2xl font-extrabold text-rose-700 mt-1">{invalidRows.length}</p>
              </div>
            </div>

            {invalidRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-rose-650 font-bold text-sm">
                  <XCircle className="h-5 w-5" />
                  <span>Xatolik aniqlangan qatorlar ro‘yxati</span>
                </div>
                
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Qator</TableHead>
                        <TableHead>Ism</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Hudud</TableHead>
                        <TableHead>Muammo (Xatolik)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invalidRows.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-bold">{err.row}</TableCell>
                          <TableCell>{err.fullName || '-'}</TableCell>
                          <TableCell>{err.certificateId || '-'}</TableCell>
                          <TableCell>{err.region || '-'}</TableCell>
                          <TableCell className="text-rose-600 font-medium">{err.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  * Xatoliklarni to‘g‘rilash uchun Excel faylni tahrirlab, qaytadan yuklashingiz mumkin. Valid qatorlar bo‘yicha generatsiyani davom ettirish ham mumkin.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-6 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(3)} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Orqaga</span>
            </Button>
            <Button
              onClick={() => setStep(5)}
              disabled={validParticipants.length === 0}
              className="flex items-center space-x-2"
            >
              <span>Keyingi qadam (Preview)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 5: Preview Single Certificate */}
      {step === 5 && (
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Sertifikat Ko‘rinishini Tasdiqlang (Preview)</CardTitle>
            <CardDescription>Generatsiya qilishdan oldin sertifikat joylashuvini ko‘zdan kechiring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {validParticipants.length > 0 && (
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-150/60">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tekshirilayotgan qatnashchi</span>
                  <p className="text-sm font-bold text-slate-800">
                    {validParticipants[previewParticipantIndex].fullName || Object.values(validParticipants[previewParticipantIndex].dynamicFields || {}).find(v => v && v.length > 2) || validParticipants[previewParticipantIndex].certificateId || 'Noma\'lum'}
                  </p>
                  <p className="text-xs text-indigo-600 font-semibold">
                    {validParticipants[previewParticipantIndex].certificateId && `ID: ${validParticipants[previewParticipantIndex].certificateId}`}
                    {validParticipants[previewParticipantIndex].region && ` | Hudud: ${validParticipants[previewParticipantIndex].region}`}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={previewParticipantIndex === 0}
                    onClick={() => {
                      setPreviewParticipantIndex(p => p - 1);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-semibold text-slate-500">
                    {previewParticipantIndex + 1} / {validParticipants.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={previewParticipantIndex === validParticipants.length - 1}
                    onClick={() => {
                      setPreviewParticipantIndex(p => p + 1);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="h-[50vh] bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 shadow-inner overflow-hidden">
              {previewLoading ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                  <p className="text-sm text-slate-500 font-medium">Sertifikat tayyorlanmoqda...</p>
                </div>
              ) : previewPdfUrl ? (
                <iframe src={previewPdfUrl} className="w-full h-full border-none" />
              ) : (
                <p className="text-slate-500 text-sm">Preview yuklab bo‘lmadi.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-6 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(4)} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Orqaga</span>
            </Button>
            <Button
              onClick={handleStartGeneration}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4 mr-2" />
              <span>Generatsiyani boshlash</span>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 6: Generation Progress */}
      {step === 6 && (
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Sertifikatlar Yaratilmoqda...</CardTitle>
            <CardDescription>Barcha sertifikatlar serverda qayta ishlanmoqda. Browser oynasini yopmang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                <span>Jarayon foizi</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} />
            </div>

            <div className="grid grid-cols-3 gap-6 text-center pt-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Jami yaratiladigan</span>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{validParticipants.length}</p>
              </div>
              <div className="p-4 bg-emerald-550/10 rounded-2xl border border-emerald-100 text-emerald-850">
                <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Muvaffaqiyatli</span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">{successCount}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800">
                <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">Xatolik (Failed)</span>
                <p className="text-2xl font-extrabold text-rose-700 mt-1">{failedCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 py-6">
              <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-indigo-750">PDF fayllar tayyorlanmoqda... ({totalProcessed} / {validParticipants.length})</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 7: Completed & Download */}
      {step === 7 && (
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-4 bg-emerald-100 text-emerald-700 rounded-full w-fit mb-4">
              <CheckCircle2 className="h-12 w-12 animate-bounce" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-900">Yaratish Jarayoni Yakunlandi!</CardTitle>
            <CardDescription className="text-slate-550 font-medium">
              Sertifikatlar muvaffaqiyatli tayyorlandi va arxivlandi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center max-w-md mx-auto">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Muvaffaqiyatli</span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">{successCount} ta</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Xatolik</span>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{failedCount} ta</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-4 pt-6 border-t border-slate-100">
              {successCount > 0 && (
                <a href={`/api/generate/${generationId}/download?type=zip`} download>
                  <Button size="lg" className="w-full sm:w-auto">
                    <Download className="h-5 w-5 mr-2" />
                    ZIP Arxivini Yuklash
                  </Button>
                </a>
              )}

              {failedCount > 0 && (
                <a href={`/api/generate/${generationId}/download?type=error`} download>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-rose-700 border-rose-250 hover:bg-rose-50">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Xatoliklar hisobotini yuklash
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 pt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setStep(1);
                setExcelFile(null);
                setValidParticipants([]);
                setInvalidRows([]);
                setGenerationId(null);
                setGenerationStatus('PENDING');
              }}
            >
              Yangi generatsiya boshlash
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="p-8 max-w-5xl mx-auto w-full flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Sahifa yuklanmoqda...</p>
      </div>
    }>
      <GeneratePageContent />
    </Suspense>
  );
}
