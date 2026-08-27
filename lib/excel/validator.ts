import { ParticipantInput, RowError, ExcelValidationResult } from '../../types';

export interface ColumnMapping {
  fullNameColumn: string;
  certificateIdColumn: string;
  regionColumn?: string; // Optional mapping for region
}

/**
 * Validates raw rows from Excel/CSV and maps them into internal participant format.
 * Detects missing values, duplicate IDs, and extracts optional region names.
 */
export function validateExcelRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ExcelValidationResult {
  const valid: ParticipantInput[] = [];
  const invalid: RowError[] = [];
  const seenIds = new Set<string>();

  rows.forEach((row, index) => {
    const excelRowNumber = index + 2; // Row 1 is usually the header row
    const rawFullName = row[mapping.fullNameColumn]?.toString().trim() || '';
    const rawCertificateId = row[mapping.certificateIdColumn]?.toString().trim() || '';
    const rawRegion = mapping.regionColumn ? (row[mapping.regionColumn]?.toString().trim() || '') : '';

    // Check if empty row
    if (!rawFullName && !rawCertificateId) {
      // Skip completely empty rows
      return;
    }

    let errorMsg = '';

    if (!rawFullName) {
      errorMsg = 'Full Name is missing.';
    } else if (!rawCertificateId) {
      errorMsg = 'Certificate ID is missing.';
    } else if (seenIds.has(rawCertificateId)) {
      errorMsg = `Duplicate Certificate ID: "${rawCertificateId}".`;
    }

    if (errorMsg) {
      invalid.push({
        row: excelRowNumber,
        fullName: rawFullName,
        certificateId: rawCertificateId,
        region: rawRegion,
        error: errorMsg,
      });
    } else {
      seenIds.add(rawCertificateId);
      valid.push({
        fullName: rawFullName,
        certificateId: rawCertificateId,
        region: rawRegion,
        sourceRow: excelRowNumber,
      });
    }
  });

  return {
    total: rows.length,
    valid,
    invalid,
  };
}
