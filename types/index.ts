export interface TemplateField {
  key: string;
  label: string; // User-facing name (e.g. "F.I.Sh", "Kurs Nomi")
  type: 'text';
  fontFamily: string; // Changed to string to allow any font
  fontSize: number;
  minFontSize: number;
  maxFontSize: number;
  alignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'middle' | 'bottom';
  fontStyle?: 'normal' | 'italic' | 'bold' | 'bold-italic'; // Text style configuration
  x: number;      // PDF points
  y: number;      // PDF points
  width: number;  // PDF points
  height: number; // PDF points
}

export interface TemplateConfiguration {
  page: number;
  fields: TemplateField[];
}

export interface ParticipantInput {
  // Required core fields
  fullName: string;
  certificateId: string;
  region?: string; // Mapped region (hudud)
  sourceRow: number;
  // Dynamic fields
  dynamicFields?: Record<string, string>;
}

export interface RowError {
  row: number;
  fullName: string;
  certificateId: string;
  region?: string;
  error: string;
}

export interface ExcelValidationResult {
  total: number;
  valid: ParticipantInput[];
  invalid: RowError[];
}
