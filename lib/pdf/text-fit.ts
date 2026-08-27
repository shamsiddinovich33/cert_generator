import { PDFFont } from 'pdf-lib';

export interface TextFitResult {
  success: boolean;
  fontSize: number;
  error?: 'TEXT_DOES_NOT_FIT' | 'ID_DOES_NOT_FIT';
}

/**
 * Calculates the appropriate font size for a Full Name within a given box.
 * Sizing must stay within [minFontSize, maxFontSize] limits.
 */
export function fitFullName(
  text: string,
  font: PDFFont,
  fieldWidth: number,
  fieldHeight: number,
  maxFontSize = 32,
  minFontSize = 18
): TextFitResult {
  let fontSize = maxFontSize;

  while (fontSize >= minFontSize) {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    // font.heightAtSize measures the vertical height of the font at a given size
    const textHeight = font.heightAtSize(fontSize);

    if (textWidth <= fieldWidth && textHeight <= fieldHeight) {
      return { success: true, fontSize };
    }
    fontSize -= 1;
  }

  return { success: false, fontSize: minFontSize, error: 'TEXT_DOES_NOT_FIT' };
}

/**
 * Validates whether the certificate ID fits inside the field box at 14 pt.
 * The font size of the ID must NEVER change from 14 pt.
 */
export function fitCertificateId(
  text: string,
  font: PDFFont,
  fieldWidth: number,
  fieldHeight: number,
  targetSize = 14
): TextFitResult {
  const textWidth = font.widthOfTextAtSize(text, targetSize);
  const textHeight = font.heightAtSize(targetSize);

  if (textWidth <= fieldWidth && textHeight <= fieldHeight) {
    return { success: true, fontSize: targetSize };
  }

  return { success: false, fontSize: targetSize, error: 'ID_DOES_NOT_FIT' };
}
