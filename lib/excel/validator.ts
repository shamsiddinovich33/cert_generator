import { ParticipantInput, RowError, ExcelValidationResult } from '../../types';

export interface ColumnMapping {
  fullNameColumn: string;
  certificateIdColumn: string;
  regionColumn?: string; // Optional mapping for region
  dynamicColumns?: Record<string, string>; // Maps template field key to Excel column name
}

/**
 * Sanitizes Uzbek apostrophe variants into standard single quote.
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019\u201A\u201B\u02BB\u02BC\u02B9\u02BA\u00B4\u0060\u2032\u2035\u055A\u07F4\u07F5\uFF07\uFF40\u0313\u0314\u0315\u02C8\u02CA\u02CB\u0312\u0357]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB\uFF02]/g, '"');
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
    const rawFullName = sanitizeText(mapping.fullNameColumn ? (row[mapping.fullNameColumn]?.toString().trim() || '') : '');
    const rawCertificateId = sanitizeText(mapping.certificateIdColumn ? (row[mapping.certificateIdColumn]?.toString().trim() || '') : '');
    const rawRegion = sanitizeText(mapping.regionColumn ? (row[mapping.regionColumn]?.toString().trim() || '') : '');

    // Map dynamic fields
    const dynamicFields: Record<string, string> = {};
    if (mapping.dynamicColumns) {
      for (const [fieldKey, colName] of Object.entries(mapping.dynamicColumns)) {
        if (colName) {
          dynamicFields[fieldKey] = sanitizeText(row[colName]?.toString().trim() || '');
        }
      }
    }

    // Check if completely empty row across all mapped core fields
    if (!rawFullName && !rawCertificateId && Object.values(dynamicFields).every(val => !val)) {
      return; // Skip completely empty rows
    }

    let errorMsg = '';

    if (mapping.fullNameColumn && !rawFullName) {
      errorMsg = 'Full Name is missing.';
    } else if (mapping.certificateIdColumn && !rawCertificateId) {
      errorMsg = 'Certificate ID is missing.';
    } else if (rawCertificateId && seenIds.has(rawCertificateId)) {
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
        dynamicFields,
      });
    }
  });

  return {
    total: rows.length,
    valid,
    invalid,
  };
}
