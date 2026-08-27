import { ParticipantInput, RowError, ExcelValidationResult } from '../../types';

export interface ColumnMapping {
  fullNameColumn: string;
  certificateIdColumn: string;
  regionColumn?: string; // Optional mapping for region
  dynamicColumns?: Record<string, string>; // Maps template field key to Excel column name
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
    const rawFullName = mapping.fullNameColumn ? (row[mapping.fullNameColumn]?.toString().trim() || '') : '';
    const rawCertificateId = mapping.certificateIdColumn ? (row[mapping.certificateIdColumn]?.toString().trim() || '') : '';
    const rawRegion = mapping.regionColumn ? (row[mapping.regionColumn]?.toString().trim() || '') : '';

    // Map dynamic fields
    const dynamicFields: Record<string, string> = {};
    if (mapping.dynamicColumns) {
      for (const [fieldKey, colName] of Object.entries(mapping.dynamicColumns)) {
        if (colName) {
          dynamicFields[fieldKey] = row[colName]?.toString().trim() || '';
        }
      }
    }

    // Check if completely empty row across all mapped core fields
    if (!rawFullName && !rawCertificateId && Object.values(dynamicFields).every(val => !val)) {
      return; // Skip completely empty rows
    }

    let errorMsg = '';

    if (rawCertificateId && seenIds.has(rawCertificateId)) {
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
