'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Loader2, 
  AlertCircle,
  FileCheck,
  Move,
  Maximize2
} from 'lucide-react';
import { TemplateConfiguration, TemplateField } from '@/types';
import { browserToPdfCoordinates, pdfToBrowserCoordinates, Rectangle } from '@/lib/pdf/coordinates';

// Dynamically load PDFJS from CDN
const PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
const PDFJS_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  originalFileUrl: string;
  configuration: TemplateConfiguration;
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field states (in PDF points, as stored in DB)
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedFieldKey, setSelectedFieldKey] = useState<'fullName' | 'certificateId'>('fullName');

  // Preview dimensions (for coordinate mapping)
  const [pdfDimensions, setPdfDimensions] = useState({ width: 595, height: 842 }); // Default A4
  const [containerDimensions, setContainerDimensions] = useState({ width: 595, height: 842 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // PDF.js loading state
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);

  // Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Drag and resize mouse state variables
  const dragStartRef = useRef<{ x: number; y: number; originalX: number; originalY: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; originalWidth: number; originalHeight: number; originalX: number; originalY: number } | null>(null);
  const activeInteractionRef = useRef<'drag' | 'resize' | null>(null);
  const interactingFieldKeyRef = useRef<'fullName' | 'certificateId' | null>(null);

  // 1. Load PDFJS CDN scripts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).pdfjsLib) {
      setPdfjsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = PDFJS_SRC;
    script.async = true;
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
      setPdfjsLoaded(true);
    };
    script.onerror = () => {
      setError('PDF rendering kutubxonasini yuklab bo‘lmadi.');
    };
    document.body.appendChild(script);

    return () => {
      // Clean up script tag if needed, but keeping it is fine
    };
  }, []);

  // 2. Fetch template data
  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/templates/${templateId}`);
      const json = await res.json();
      if (json.success) {
        setTemplate(json.data);
        const config = json.data.configuration as TemplateConfiguration;
        setFields(config.fields);
      } else {
        setError(json.error?.message || 'Shablon yuklanmadi.');
      }
    } catch (err) {
      setError('Server bilan bog‘lanishda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  // 3. Render PDF into Canvas when template and PDFJS are loaded
  useEffect(() => {
    if (!pdfjsLoaded || !template || !canvasRef.current) return;

    let isCancelled = false;

    const renderPdf = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        // Fetch original file as ArrayBuffer
        const response = await fetch(template.originalFileUrl);
        const arrayBuffer = await response.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        if (isCancelled) return;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });

        // Set dimensions in points
        setPdfDimensions({ width: viewport.width, height: viewport.height });

        // Render onto canvas
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        // Adjust for device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Also scale drawing context
        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Sync container dimensions (initially equal to PDF points)
        setContainerDimensions({ width: viewport.width, height: viewport.height });
      } catch (err) {
        console.error('Error rendering PDF template:', err);
        setError('PDF shablonini render qilishda xatolik.');
      }
    };

    renderPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfjsLoaded, template]);

  // Sync container dimensions on window resize or when ref changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Verify width is valid before updating to avoid 0 size bugs
        if (width > 0 && height > 0) {
          setContainerDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [template, pdfjsLoaded]);

  // Helper to convert PDF coordinates to Browser pixels
  const getBrowserRect = (field: TemplateField): Rectangle => {
    return pdfToBrowserCoordinates(
      { x: field.x, y: field.y, width: field.width, height: field.height },
      containerDimensions,
      pdfDimensions
    );
  };

  // 4. Handle Mouse Actions for Dragging & Resizing (in Browser Pixels, then converted to PDF Points)
  const handleMouseDown = (
    e: React.MouseEvent,
    fieldKey: 'fullName' | 'certificateId',
    action: 'drag' | 'resize'
  ) => {
    e.preventDefault();
    setSelectedFieldKey(fieldKey);
    
    const field = fields.find((f) => f.key === fieldKey);
    if (!field) return;

    const browserRect = getBrowserRect(field);
    activeInteractionRef.current = action;
    interactingFieldKeyRef.current = fieldKey;

    if (action === 'drag') {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        originalX: browserRect.x,
        originalY: browserRect.y,
      };
    } else {
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        originalWidth: browserRect.width,
        originalHeight: browserRect.height,
        originalX: browserRect.x,
        originalY: browserRect.y,
      };
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const action = activeInteractionRef.current;
    const fieldKey = interactingFieldKeyRef.current;
    if (!action || !fieldKey) return;

    const field = fields.find((f) => f.key === fieldKey);
    if (!field) return;

    const currentBrowserRect = getBrowserRect(field);
    let newBrowserRect = { ...currentBrowserRect };

    if (action === 'drag' && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      newBrowserRect.x = dragStartRef.current.originalX + dx;
      newBrowserRect.y = dragStartRef.current.originalY + dy;

      // Constrain inside container boundary
      newBrowserRect.x = Math.max(0, Math.min(containerDimensions.width - currentBrowserRect.width, newBrowserRect.x));
      newBrowserRect.y = Math.max(0, Math.min(containerDimensions.height - currentBrowserRect.height, newBrowserRect.y));
    } else if (action === 'resize' && resizeStartRef.current) {
      const dx = e.clientX - resizeStartRef.current.x;
      const dy = e.clientY - resizeStartRef.current.y;

      newBrowserRect.width = Math.max(40, resizeStartRef.current.originalWidth + dx);
      newBrowserRect.height = Math.max(20, resizeStartRef.current.originalHeight + dy);

      // Constrain within bounds
      newBrowserRect.width = Math.min(containerDimensions.width - resizeStartRef.current.originalX, newBrowserRect.width);
      newBrowserRect.height = Math.min(containerDimensions.height - resizeStartRef.current.originalY, newBrowserRect.height);
    }

    // Convert back to PDF points and update state
    const newPdfRect = browserToPdfCoordinates(
      newBrowserRect,
      containerDimensions,
      pdfDimensions
    );

    setFields((prev) =>
      prev.map((f) =>
        f.key === fieldKey
          ? {
              ...f,
              x: Math.round(newPdfRect.x),
              y: Math.round(newPdfRect.y),
              width: Math.round(newPdfRect.width),
              height: Math.round(newPdfRect.height),
            }
          : f
      )
    );
  };

  const handleMouseUp = () => {
    activeInteractionRef.current = null;
    interactingFieldKeyRef.current = null;
    dragStartRef.current = null;
    resizeStartRef.current = null;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Clean up global listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Update a single property of the selected field
  const updateFieldProperty = (key: keyof TemplateField, value: any) => {
    setFields((prev) =>
      prev.map((f) => (f.key === selectedFieldKey ? { ...f, [key]: value } as any : f))
    );
  };

  // 5. Save Configuration to Database
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updatedConfig: TemplateConfiguration = {
        page: 1,
        fields,
      };

      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuration: updatedConfig }),
      });

      const json = await res.json();
      if (json.success) {
        alert('Sozlamalar muvaffaqiyatli saqlandi.');
      } else {
        setError(json.error?.message || 'Saqlashda xatolik yuz berdi.');
      }
    } catch (err) {
      setError('Server bilan bog‘lanib bo‘lmadi.');
    } finally {
      setSaving(false);
    }
  };

  // 6. Test Preview PDF Generation
  const handleTestPreview = async () => {
    try {
      setPreviewLoading(true);
      setPreviewOpen(true);
      setPreviewPdfUrl(null);
      setError(null);

      const activeConfig: TemplateConfiguration = {
        page: 1,
        fields,
      };

      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          configuration: activeConfig,
          fullName: 'Abdullayev Muhammadali',
          certificateId: 'K00001',
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Sertifikat preview xatoligi.');
      }

      // Convert response stream to object URL
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    } catch (err: any) {
      setError(err?.message || 'Preview tayyorlashda xatolik.');
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const selectedField = fields.find((f) => f.key === selectedFieldKey);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-100">
      {/* Editor Sub-Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <NextLink
            href="/templates"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </NextLink>
          <div>
            <h2 className="text-lg font-bold text-slate-900 line-clamp-1">
              {template?.name || 'Shablon tahrirlovchi'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Shablonni joylashtirish koordinatalari
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleTestPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Test Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Saqlash
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 mx-6 mt-4 bg-red-50 text-red-700 border border-red-250 rounded-xl flex items-center space-x-3 shrink-0">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading || !pdfjsLoaded ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 bg-white">
          <Loader2 className="h-8 w-8 text-indigo-650 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Shablon tahrirlovchi yuklanmoqda...</p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Canvas PDF Viewer & Drag Overlay */}
          <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-200">
            <div
              ref={containerRef}
              className="relative shadow-2xl border border-slate-350 bg-white rounded-lg select-none"
              style={{
                width: `${pdfDimensions.width}px`,
                height: `${pdfDimensions.height}px`,
              }}
            >
              {/* PDF Background Canvas */}
              <canvas ref={canvasRef} className="absolute inset-0 rounded-lg pointer-events-none" />

              {/* Fields Overlay */}
              {fields.map((field) => {
                const rect = getBrowserRect(field);
                const isSelected = field.key === selectedFieldKey;

                return (
                  <div
                    key={field.key}
                    className={`absolute rounded group border-2 flex flex-col justify-between transition-shadow ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20 z-20'
                        : 'border-slate-400 bg-slate-100/10 hover:border-slate-500 hover:bg-slate-200/10 z-10'
                    }`}
                    style={{
                      left: `${rect.x}px`,
                      top: `${rect.y}px`,
                      width: `${rect.width}px`,
                      height: `${rect.height}px`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFieldKey(field.key);
                    }}
                  >
                    {/* Header bar for dragging */}
                    <div
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-move text-white flex items-center justify-between ${
                        isSelected ? 'bg-indigo-600' : 'bg-slate-550'
                      }`}
                      onMouseDown={(e) => handleMouseDown(e, field.key, 'drag')}
                    >
                      <span className="flex items-center">
                        <Move className="h-3 w-3 mr-1" />
                        {field.key === 'fullName' ? 'Ism (Full Name)' : 'Sertifikat ID'}
                      </span>
                      <span className="opacity-90">{field.fontFamily}</span>
                    </div>

                    {/* Content area: visual indicator of alignment */}
                    <div
                      className={`flex-1 p-1 text-[11px] font-semibold flex items-center truncate ${
                        field.alignment === 'center'
                          ? 'justify-center text-center'
                          : field.alignment === 'right'
                          ? 'justify-end text-right'
                          : 'justify-start text-left'
                      } ${
                        isSelected ? 'text-indigo-900' : 'text-slate-600'
                      } ${
                        field.fontStyle === 'italic'
                          ? 'italic'
                          : field.fontStyle === 'bold'
                          ? 'font-bold'
                          : field.fontStyle === 'bold-italic'
                          ? 'font-bold italic'
                          : ''
                      }`}
                    >
                      {field.key === 'fullName' ? 'Abdullayev Muhammadali' : 'K00001'}
                    </div>

                    {/* Resize handle (bottom right corner) */}
                    <div
                      className={`absolute bottom-0 right-0 h-4.5 w-4.5 cursor-se-resize flex items-center justify-center rounded-tl ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-400 text-slate-700'
                      }`}
                      onMouseDown={(e) => handleMouseDown(e, field.key, 'resize')}
                    >
                      <Maximize2 className="h-3 w-3 scale-75" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Field Settings Panel */}
          <div className="w-80 border-l border-slate-200 bg-white p-6 overflow-y-auto shrink-0 flex flex-col justify-between">
            {selectedField ? (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-indigo-650 uppercase tracking-widest">
                    Maydon sozlamalari
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">
                    {selectedField.key === 'fullName' ? 'F.I.Sh (Full Name)' : 'Sertifikat ID'}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Font Family (Only Georgia for Name, Bahnschrift for ID as per rule) */}
                  <Select
                    label="Font (Shrift)"
                    value={selectedField.fontFamily}
                    onChange={(e) => updateFieldProperty('fontFamily', e.target.value)}
                    options={
                      selectedField.key === 'fullName'
                        ? [{ value: 'Georgia', label: 'Georgia' }]
                        : [{ value: 'Bahnschrift', label: 'Bahnschrift' }]
                    }
                  />

                  {/* Font Style Choice */}
                  <Select
                    label="Style (Stil)"
                    value={selectedField.fontStyle || 'normal'}
                    onChange={(e) => updateFieldProperty('fontStyle', e.target.value)}
                    options={[
                      { value: 'normal', label: 'Normal (Oddiy)' },
                      { value: 'italic', label: 'Italic / Oblique (Kursiv)' },
                      { value: 'bold', label: 'Bold (Qalin)' },
                      { value: 'bold-italic', label: 'Bold Italic (Qalin Kursiv)' },
                    ]}
                  />

                  {/* Font Size controls */}
                  {selectedField.key === 'fullName' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Min Size (pt)"
                        type="number"
                        min="10"
                        max="32"
                        value={selectedField.minFontSize}
                        onChange={(e) => updateFieldProperty('minFontSize', parseInt(e.target.value) || 18)}
                      />
                      <Input
                        label="Max Size (pt)"
                        type="number"
                        min="18"
                        max="60"
                        value={selectedField.maxFontSize}
                        onChange={(e) => updateFieldProperty('maxFontSize', parseInt(e.target.value) || 32)}
                      />
                    </div>
                  ) : (
                    <Input
                      label="Font Size (pt)"
                      type="number"
                      value={selectedField.fontSize}
                      disabled
                      className="bg-slate-50 text-slate-450 border-slate-100"
                    />
                  )}

                  {/* Horizontal Alignment */}
                  <Select
                    label="Tekislash (Alignment)"
                    value={selectedField.alignment}
                    onChange={(e) => updateFieldProperty('alignment', e.target.value)}
                    options={[
                      { value: 'center', label: 'Markaz (Center)' },
                      { value: 'left', label: 'Chap (Left)' },
                      { value: 'right', label: 'O‘ng (Right)' },
                    ]}
                  />

                  {/* Vertical Alignment */}
                  <Select
                    label="Vertikal Tekislash"
                    value={selectedField.verticalAlignment}
                    onChange={(e) => updateFieldProperty('verticalAlignment', e.target.value)}
                    options={[
                      { value: 'middle', label: 'O‘rtada (Middle)' },
                      { value: 'top', label: 'Tepada (Top)' },
                      { value: 'bottom', label: 'Pastda (Bottom)' },
                    ]}
                  />

                  {/* Coordinate readouts/inputs */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Koordinatalar (PDF ballarda - Pt)
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="X (Chapdan masofa)"
                        type="number"
                        value={selectedField.x}
                        onChange={(e) => updateFieldProperty('x', parseInt(e.target.value) || 0)}
                      />
                      <Input
                        label="Y (Pastdan masofa)"
                        type="number"
                        value={selectedField.y}
                        onChange={(e) => updateFieldProperty('y', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Kenglik (Width)"
                        type="number"
                        value={selectedField.width}
                        onChange={(e) => updateFieldProperty('width', parseInt(e.target.value) || 0)}
                      />
                      <Input
                        label="Balandlik (Height)"
                        type="number"
                        value={selectedField.height}
                        onChange={(e) => updateFieldProperty('height', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Sozlash uchun maydonni tanlang.</p>
            )}

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                * Drag & drop yordamida maydonni o‘zgartiring. <br />
                * Koordinata o‘zgarishlari saqlanishi uchun <b>Saqlash</b> tugmasini bosing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Test Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <div>
                <h3 className="text-md font-bold text-slate-800">Sertifikat Sinov Ko‘rinishi (Test Preview)</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">F.I.Sh: Abdullayev Muhammadali | ID: K00001</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (previewPdfUrl) {
                    URL.revokeObjectURL(previewPdfUrl);
                  }
                  setPreviewOpen(false);
                }}
              >
                Yopish
              </Button>
            </div>

            <div className="flex-1 bg-slate-100 p-6 flex items-center justify-center">
              {previewLoading ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-8 w-8 text-indigo-650 animate-spin" />
                  <p className="text-sm text-slate-550 font-medium">Sertifikat generatsiya qilinmoqda...</p>
                </div>
              ) : previewPdfUrl ? (
                <iframe src={previewPdfUrl} className="w-full h-full rounded-2xl border border-slate-250 shadow-inner" />
              ) : (
                <p className="text-slate-500 text-sm">Preview hosil qilib bo‘lmadi.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
