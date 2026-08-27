import { browserToPdfCoordinates, pdfToBrowserCoordinates } from '../lib/pdf/coordinates';
import { fitFullName, fitCertificateId } from '../lib/pdf/text-fit';
import { sanitizeFileName } from '../lib/zip/generator';
import { validateExcelRows } from '../lib/excel/validator';

// A mock PDFFont class for text fitting tests
const mockFont = {
  widthOfTextAtSize(text: string, size: number) {
    // Simple mock: assume width is text length * size * 0.6
    return text.length * size * 0.6;
  },
  heightAtSize(size: number) {
    return size * 0.95;
  }
} as any;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log('--- Running Coordinate Conversion Tests ---');
  {
    const pdfDim = { width: 595, height: 842 };
    const containerDim = { width: 595, height: 842 }; // 1:1 scale
    
    // Test 1: Coordinates at top left of container
    const browserRect = { x: 100, y: 100, width: 400, height: 50 };
    const pdfRect = browserToPdfCoordinates(browserRect, containerDim, pdfDim);
    
    // In PDF, y should start from bottom.
    // Bottom of browser rect is at y = 150 px.
    // Corresponding PDF y is 842 - 150 = 692.
    assert(pdfRect.x === 100, 'pdfRect.x should be 100');
    assert(pdfRect.y === 692, 'pdfRect.y should be 692');
    assert(pdfRect.width === 400, 'pdfRect.width should be 400');
    assert(pdfRect.height === 50, 'pdfRect.height should be 50');

    // Test 2: Reverse conversion
    const backToBrowser = pdfToBrowserCoordinates(pdfRect, containerDim, pdfDim);
    assert(backToBrowser.x === 100, 'backToBrowser.x should be 100');
    assert(backToBrowser.y === 100, 'backToBrowser.y should be 100');
    assert(backToBrowser.width === 400, 'backToBrowser.width should be 400');
    assert(backToBrowser.height === 50, 'backToBrowser.height should be 50');
  }

  console.log('\n--- Running Text Fitting Tests ---');
  {
    // Test 1: Short name fits at max size (32pt)
    const shortName = 'Aliyev Aziz';
    // mock width at 32pt = 11 chars * 32 * 0.6 = 211.2. mock height = 30.4
    const fit1 = fitFullName(shortName, mockFont, 300, 50, 32, 18);
    assert(fit1.success === true, 'shortName should fit');
    assert(fit1.fontSize === 32, 'shortName size should be 32');

    // Test 2: Medium name shrinks to fit
    const mediumName = 'Abdullayev Muhammadali'; // 22 chars
    // Width at 32pt = 22 * 32 * 0.6 = 422.4 (won't fit in 300)
    // Width at 22pt = 22 * 22 * 0.6 = 290.4 (fits in 300)
    const fit2 = fitFullName(mediumName, mockFont, 300, 50, 32, 18);
    assert(fit2.success === true, 'mediumName should fit after scaling');
    assert(fit2.fontSize >= 18 && fit2.fontSize < 32, `mediumName scaled to ${fit2.fontSize}`);

    // Test 3: Very long name does not fit even at 18pt
    const veryLongName = 'Abdullayev Muhammadali Bahodirovich Qudratovich'; // 47 chars
    // Width at 18pt = 47 * 18 * 0.6 = 507.6 (won't fit in 300)
    const fit3 = fitFullName(veryLongName, mockFont, 300, 50, 32, 18);
    assert(fit3.success === false, 'veryLongName should fail to fit');
    assert(fit3.error === 'TEXT_DOES_NOT_FIT', 'error should be TEXT_DOES_NOT_FIT');

    // Test 4: ID at 14pt fits
    const fitId1 = fitCertificateId('K00001', mockFont, 100, 20, 14);
    assert(fitId1.success === true, 'ID should fit at 14pt');
    assert(fitId1.fontSize === 14, 'ID font size must remain 14pt');

    // Test 5: ID at 14pt does not fit (and doesn't shrink)
    const fitId2 = fitCertificateId('K00001-LONG-ID-TEST', mockFont, 100, 20, 14);
    assert(fitId2.success === false, 'long ID should fail to fit');
    assert(fitId2.error === 'ID_DOES_NOT_FIT', 'error should be ID_DOES_NOT_FIT');
  }

  console.log('\n--- Running Filename Sanitization Tests ---');
  {
    assert(sanitizeFileName('Aliyev/Aziz') === 'Aliyev_Aziz', 'slash replaced by underscore');
    assert(sanitizeFileName('Karimova\\Dilnoza') === 'Karimova_Dilnoza', 'backslash replaced');
    assert(sanitizeFileName('test:id*name?file') === 'test_id_name_file', 'special characters replaced');
  }

  console.log('\n--- Running Excel Parsing & Validation Tests ---');
  {
    const rows = [
      { 'F.I.Sh': 'Aliyev Aziz', 'ID': 'K00001' },
      { 'F.I.Sh': 'Karimova Dilnoza', 'ID': 'K00002' },
      { 'F.I.Sh': '', 'ID': 'K00003' }, // Empty name
      { 'F.I.Sh': 'Jasur', 'ID': '' }, // Empty ID
      { 'F.I.Sh': 'Duplicate Person', 'ID': 'K00001' }, // Duplicate ID
    ];

    const mapping = {
      fullNameColumn: 'F.I.Sh',
      certificateIdColumn: 'ID',
    };

    const result = validateExcelRows(rows, mapping);
    assert(result.valid.length === 2, 'should have 2 valid rows');
    assert(result.invalid.length === 3, 'should have 3 invalid rows');
    
    assert(result.invalid[0].row === 4, 'Row 4 should be invalid (empty name)');
    assert(result.invalid[0].error.includes('Full Name is missing'), 'empty name check');

    assert(result.invalid[1].row === 5, 'Row 5 should be invalid (empty ID)');
    assert(result.invalid[1].error.includes('Certificate ID is missing'), 'empty ID check');

    assert(result.invalid[2].row === 6, 'Row 6 should be invalid (duplicate ID)');
    assert(result.invalid[2].error.includes('Duplicate Certificate ID'), 'duplicate check');
  }

  console.log('\nALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(console.error);
