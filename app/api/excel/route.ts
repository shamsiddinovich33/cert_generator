import { NextResponse } from 'next/server';
import { parseExcel } from '@/lib/excel/parser';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sheetName = formData.get('sheetName') as string || undefined;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file uploaded.',
          },
        },
        { status: 400 }
      );
    }

    // Read bytes
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Parse Excel/CSV
    const parsedData = parseExcel(fileBuffer, sheetName);

    // Calculate columns/headers from first row if sheet parsed
    let columns: string[] = [];
    let previewRows: Record<string, string>[] = [];

    if (parsedData.rows && parsedData.rows.length > 0) {
      columns = Object.keys(parsedData.rows[0]);
      // Return first 50 rows as preview
      previewRows = parsedData.rows.slice(0, 50);
    }

    return NextResponse.json({
      success: true,
      data: {
        sheetNames: parsedData.sheetNames,
        columns,
        previewRows,
        totalRows: parsedData.rows ? parsedData.rows.length : 0,
      },
    });
  } catch (error: any) {
    console.error('Error parsing Excel:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PARSING_ERROR',
          message: error?.message || 'Failed to parse Excel file. Make sure file format is correct.',
        },
      },
      { status: 500 }
    );
  }
}
