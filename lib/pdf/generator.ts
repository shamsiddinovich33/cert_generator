import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { TemplateConfiguration } from '../../types';
import { loadFontFiles } from './fonts';
import { fitFullName, fitCertificateId } from './text-fit';

export interface GenerateCertificateArgs {
  templatePdfBuffer: Buffer;
  configuration: TemplateConfiguration;
  fullName: string;
  certificateId: string;
}

export interface GenerationResult {
  success: boolean;
  pdfBuffer?: Buffer;
  error?: 'TEXT_DOES_NOT_FIT' | 'ID_DOES_NOT_FIT' | string;
}

/**
 * Sanitizes Uzbek apostrophe variants (like modifier turnhead comma, grave/acute accents,
 * and curly quotes) into a standard single quote (') that is universally supported by TTF fonts.
 */
export function sanitizeUzbekText(text: string): string {
  if (!text) return '';
  return text
    // Replace modifier letter turnhead comma (U+02BB), modifier letter apostrophe (U+02BC),
    // curly single quotes (U+2018, U+2019), grave accent (U+0060), and acute accent (U+00B4)
    // with the standard typewriter single quote apostrophe (U+0027) which is fully supported by all fonts.
    .replace(/[\u2018\u2019\u02BB\u02BC\u00B4\u0060]/g, "'");
}

/**
 * Generates a single certificate PDF by overlays fullName and certificateId
 * onto the cloned template PDF.
 */
export async function generateCertificate({
  templatePdfBuffer,
  configuration,
  fullName,
  certificateId,
}: GenerateCertificateArgs): Promise<GenerationResult> {
  try {
    const safeFullName = sanitizeUzbekText(fullName);
    const safeCertificateId = sanitizeUzbekText(certificateId);

    // 1. Load the original PDF template
    const pdfDoc = await PDFDocument.load(templatePdfBuffer);
    pdfDoc.registerFontkit(fontkit);

    // 2. Load and embed font files
    const { georgia, georgiaItalic, georgiaBold, georgiaBoldItalic, bahnschrift } = loadFontFiles();
    const georgiaFont = await pdfDoc.embedFont(georgia);
    const georgiaItalicFont = await pdfDoc.embedFont(georgiaItalic);
    const georgiaBoldFont = await pdfDoc.embedFont(georgiaBold);
    const georgiaBoldItalicFont = await pdfDoc.embedFont(georgiaBoldItalic);
    const bahnschriftFont = await pdfDoc.embedFont(bahnschrift);

    // 3. Find the fields configuration
    const fullNameConfig = configuration.fields.find((f) => f.key === 'fullName');
    const idConfig = configuration.fields.find((f) => f.key === 'certificateId');

    if (!fullNameConfig || !idConfig) {
      return {
        success: false,
        error: 'Missing fullName or certificateId in template configuration.',
      };
    }

    // Determine font to use based on configuration
    let nameFont = georgiaFont;
    if (fullNameConfig.fontStyle === 'italic') {
      nameFont = georgiaItalicFont;
    } else if (fullNameConfig.fontStyle === 'bold') {
      nameFont = georgiaBoldFont;
    } else if (fullNameConfig.fontStyle === 'bold-italic') {
      nameFont = georgiaBoldItalicFont;
    }

    // 4. Validate and fit Full Name
    const nameFit = fitFullName(
      safeFullName,
      nameFont,
      fullNameConfig.width,
      fullNameConfig.height,
      fullNameConfig.fontSize,
      fullNameConfig.minFontSize,
      fullNameConfig.maxFontSize
    );

    if (!nameFit.success) {
      return { success: false, error: nameFit.error };
    }

    // 5. Validate and fit Certificate ID
    const idFit = fitCertificateId(
      safeCertificateId,
      bahnschriftFont,
      idConfig.width,
      idConfig.height,
      idConfig.fontSize
    );

    if (!idFit.success) {
      return { success: false, error: idFit.error };
    }

    // Get target page (configuration pages are 1-indexed, pdf-lib is 0-indexed)
    const pageIndex = (configuration.page || 1) - 1;
    const pages = pdfDoc.getPages();
    if (pageIndex < 0 || pageIndex >= pages.length) {
      return { success: false, error: `Template page ${configuration.page} does not exist in PDF.` };
    }
    const page = pages[pageIndex];

    // 6. Draw Full Name
    const nameSize = nameFit.fontSize;
    const nameWidth = nameFont.widthOfTextAtSize(safeFullName, nameSize);
    
    // Calculate visual vertical baseline alignment (capHeight approximation)
    const nameCapHeight = nameFont.embedder?.font?.capHeight
      ? (nameFont.embedder.font.capHeight / nameFont.embedder.font.unitsPerEm) * nameSize
      : nameSize * 0.7;

    let nameX = fullNameConfig.x;
    if (fullNameConfig.alignment === 'center') {
      nameX = fullNameConfig.x + (fullNameConfig.width - nameWidth) / 2;
    } else if (fullNameConfig.alignment === 'right') {
      nameX = fullNameConfig.x + fullNameConfig.width - nameWidth;
    }

    let nameY = fullNameConfig.y;
    if (fullNameConfig.verticalAlignment === 'middle') {
      nameY = fullNameConfig.y + (fullNameConfig.height - nameCapHeight) / 2;
    } else if (fullNameConfig.verticalAlignment === 'top') {
      nameY = fullNameConfig.y + fullNameConfig.height - nameCapHeight;
    }

    page.drawText(safeFullName, {
      x: nameX,
      y: nameY,
      size: nameSize,
      font: nameFont,
      color: rgb(0, 0, 0), // Default text color is black
    });

    // 7. Draw Certificate ID
    const idFont = bahnschriftFont;
    const idSize = idFit.fontSize;
    const idWidth = idFont.widthOfTextAtSize(safeCertificateId, idSize);
    
    const idCapHeight = idFont.embedder?.font?.capHeight
      ? (idFont.embedder.font.capHeight / idFont.embedder.font.unitsPerEm) * idSize
      : idSize * 0.7;

    let idX = idConfig.x;
    if (idConfig.alignment === 'center') {
      idX = idConfig.x + (idConfig.width - idWidth) / 2;
    } else if (idConfig.alignment === 'right') {
      idX = idConfig.x + idConfig.width - idWidth;
    }

    let idY = idConfig.y;
    if (idConfig.verticalAlignment === 'middle') {
      idY = idConfig.y + (idConfig.height - idCapHeight) / 2;
    } else if (idConfig.verticalAlignment === 'top') {
      idY = idConfig.y + idConfig.height - idCapHeight;
    }

    page.drawText(safeCertificateId, {
      x: idX,
      y: idY,
      size: idSize,
      font: idFont,
      color: rgb(0, 0, 0),
    });

    // 8. Save and return PDF bytes
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
