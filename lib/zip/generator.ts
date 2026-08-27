import JSZip from 'jszip';

export interface ZipFileEntry {
  fullName: string;
  certificateId: string;
  region?: string; // Mapped region (hudud)
  pdfBuffer: Buffer;
}

/**
 * Sanitizes a filename to prevent invalid characters.
 */
export function sanitizeFileName(name: string): string {
  // Replace / \ : * ? " < > | with underscores
  return name.replace(/[\\\/:\*\?"<>|]/g, '_');
}

/**
 * Packs multiple certificate PDFs into a single ZIP archive,
 * grouping them into subfolders by region if provided.
 */
export async function generateZip(entries: ZipFileEntry[]): Promise<Buffer> {
  const zip = new JSZip();

  entries.forEach((entry) => {
    const cleanName = sanitizeFileName(entry.fullName);
    const cleanId = sanitizeFileName(entry.certificateId);
    const fileName = `${cleanName}_${cleanId}.pdf`;
    
    if (entry.region) {
      const cleanRegion = sanitizeFileName(entry.region.trim());
      if (cleanRegion) {
        // Place in subfolder within ZIP
        zip.file(`${cleanRegion}/${fileName}`, entry.pdfBuffer);
        return;
      }
    }

    // Default place in root of ZIP
    zip.file(fileName, entry.pdfBuffer);
  });

  const zipContent = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }, // Maximum compression
  });

  return zipContent as Buffer;
}
