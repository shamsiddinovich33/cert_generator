export interface TemplateField {
  key: 'fullName' | 'certificateId';
  type: 'text';
  fontFamily: 'Georgia' | 'Bahnschrift';
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
  fullName: string;
  certificateId: string;
  region?: string; // Mapped region (hudud)
  sourceRow: number;
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
