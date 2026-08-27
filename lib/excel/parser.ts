import { read, utils } from 'xlsx';

export interface ParsedSheetData {
  sheetNames: string[];
  selectedSheet: string;
  headers: string[]; // List of column names for frontend select dropdown
  rows: Record<string, string>[];
}

/**
 * Parses an Excel or CSV file buffer and returns sheet names and data rows.
 */
export function parseExcel(
  fileBuffer: Buffer,
  selectedSheetName?: string
): ParsedSheetData {
  // 1. Read the workbook
  const workbook = read(fileBuffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;

  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Excel faylda hech qanday varaq (sheet) topilmadi.');
  }

  // 2. Get target sheet (defaults to first sheet)
  const activeSheetName = selectedSheetName || sheetNames[0];
  const worksheet = workbook.Sheets[activeSheetName];

  if (!worksheet) {
    throw new Error(`"${activeSheetName}" nomli varaq topilmadi.`);
  }

  // 3. Convert sheet to JSON rows
  const rows = utils.sheet_to_json<Record<string, string>>(worksheet, {
    defval: '', // Bo'sh kataklarni bo'sh string ("") sifatida olish
    raw: false,  // Qiymatlarni formatlangan matn ko'rinishida olish
  });

  // 4. Extract headers (columns) from first row
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    sheetNames,
    selectedSheet: activeSheetName,
    headers,
    rows,
  };
}