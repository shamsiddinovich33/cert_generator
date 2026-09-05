import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { TemplateConfiguration, TemplateField } from '../../types';
import { loadCustomFont } from './fonts';
import { fitFullName, fitCertificateId } from './text-fit';

export interface GenerateCertificateArgs {
  templatePdfBuffer: Buffer;
  configuration: TemplateConfiguration;
  // A map of fieldKey -> value
  fieldValues: Record<string, string>;
}

export interface GenerationResult {
  success: boolean;
  pdfBuffer?: Buffer;
  error?: string;
}

/**
 * Sanitizes Uzbek apostrophe variants into standard single quote.
 * Covers: left/right single quotes, modifier letters, acute accent, backtick,
 * prime, Armenian apostrophe, and other common Unicode variants.
 */
export function sanitizeUzbekText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019\u201A\u201B\u02BB\u02BC\u02B9\u02BA\u00B4\u0060\u2032\u2035\u055A\u07F4\u07F5\uFF07\uFF40\u0313\u0314\u0315\u02C8\u02CA\u02CB\u0312\u0357]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB\uFF02]/g, '"');
}

export async function generateCertificate({
  templatePdfBuffer,
  configuration,
  fieldValues,
}: GenerateCertificateArgs): Promise<GenerationResult> {
  try {
    const pdfDoc = await PDFDocument.load(templatePdfBuffer);
    pdfDoc.registerFontkit(fontkit);

    // Cache to avoid loading the same font multiple times
    const loadedFontsCache: Record<string, PDFFont> = {};

    const loadFont = async (family: string, style?: string): Promise<PDFFont> => {
      const cacheKey = `${family}-${style || 'normal'}`;
      if (loadedFontsCache[cacheKey]) {
        return loadedFontsCache[cacheKey];
      }
      const fontBuffer = loadCustomFont(family, style);
      const embeddedFont = await pdfDoc.embedFont(fontBuffer);
      loadedFontsCache[cacheKey] = embeddedFont;
      return embeddedFont;
    };

    const pageIndex = (configuration.page || 1) - 1;
    const pages = pdfDoc.getPages();
    if (pageIndex < 0 || pageIndex >= pages.length) {
      return { success: false, error: `Template page ${configuration.page} does not exist in PDF.` };
    }
    const page = pages[pageIndex];

    for (const field of configuration.fields) {
      const rawText = fieldValues[field.key] || '';
      if (!rawText) continue; // Skip if no text is provided

      const safeText = sanitizeUzbekText(rawText);
      const font = await loadFont(field.fontFamily, field.fontStyle);

      // Fit text using existing fitFullName logic (we can reuse it for any general text)
      // For certificateId specifically, we can use fitCertificateId if we want,
      // but fitFullName works fine for general text scaling.
      let fitResult;
      if (field.key === 'certificateId') {
        fitResult = fitCertificateId(safeText, font, field.width, field.height, field.fontSize);
      } else {
        fitResult = fitFullName(safeText, font, field.width, field.height, field.maxFontSize, field.minFontSize);
      }

      if (!fitResult.success) {
        return { success: false, error: `Error fitting text for field ${field.label || field.key}: ${fitResult.error}` };
      }

      const fontSize = fitResult.fontSize;
      const textWidth = font.widthOfTextAtSize(safeText, fontSize);
      
      const fontEmbedder = (font as any).embedder;
      const capHeight = fontEmbedder?.font?.capHeight
        ? (fontEmbedder.font.capHeight / fontEmbedder.font.unitsPerEm) * fontSize
        : fontSize * 0.7;

      let x = field.x;
      if (field.alignment === 'center') {
        x = field.x + (field.width - textWidth) / 2;
      } else if (field.alignment === 'right') {
        x = field.x + field.width - textWidth;
      }

      let y = field.y;
      if (field.verticalAlignment === 'middle') {
        y = field.y + (field.height - capHeight) / 2;
      } else if (field.verticalAlignment === 'top') {
        y = field.y + field.height - capHeight;
      }

      page.drawText(safeText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return {
      success: true,
      pdfBuffer: Buffer.from(pdfBytes),
    };
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error occurred during PDF generation',
    };
  }
}
