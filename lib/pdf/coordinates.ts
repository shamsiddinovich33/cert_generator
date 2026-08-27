export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Converts browser coordinates (origin top-left) to PDF coordinates (origin bottom-left).
 */
export function browserToPdfCoordinates(
  rect: Rectangle,
  container: Dimensions,
  pdf: Dimensions
): Rectangle {
  const scaleX = pdf.width / container.width;
  const scaleY = pdf.height / container.height;

  const width = rect.width * scaleX;
  const height = rect.height * scaleY;
  const x = rect.x * scaleX;
  // Browser y is from top. PDF y is from bottom.
  // The bottom of the browser rect corresponds to the bottom of the PDF rect (closer to bottom of page).
  const y = pdf.height - ((rect.y + rect.height) * scaleY);

  return { x, y, width, height };
}

/**
 * Converts PDF coordinates (origin bottom-left) to browser coordinates (origin top-left).
 */
export function pdfToBrowserCoordinates(
  rect: Rectangle,
  container: Dimensions,
  pdf: Dimensions
): Rectangle {
  const scaleX = container.width / pdf.width;
  const scaleY = container.height / pdf.height;

  const width = rect.width * scaleX;
  const height = rect.height * scaleY;
  const x = rect.x * scaleX;
  // The top of the browser rect corresponds to the top of the PDF rect.
  // y_browser = container_height - (y_pdf + height_pdf) * scale
  const y = container.height - ((rect.y + rect.height) * scaleY);

  return { x, y, width, height };
}
