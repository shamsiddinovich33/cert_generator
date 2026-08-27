import fs from 'fs';
import path from 'path';

export function checkFontsAvailable(): { georgia: boolean; bahnschrift: boolean } {
  const georgiaPath = path.join(process.cwd(), 'public', 'fonts', 'Georgia.ttf');
  const bahnschriftPath = path.join(process.cwd(), 'public', 'fonts', 'Bahnschrift.ttf');

  return {
    georgia: fs.existsSync(georgiaPath),
    bahnschrift: fs.existsSync(bahnschriftPath),
  };
}

export function loadCustomFont(fontFamily: string, fontStyle?: string): Buffer {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  
  // Clean up fontFamily spaces to match filenames (e.g. "Times New Roman" -> "TimesNewRoman")
  const sanitizedFamily = fontFamily.replace(/\s+/g, '');
  let fileName = sanitizedFamily;
  
  if (fontStyle === 'bold') {
    fileName += '-Bold';
  } else if (fontStyle === 'italic') {
    fileName += '-Italic';
  } else if (fontStyle === 'bold-italic') {
    fileName += '-BoldItalic';
  }
  
  fileName += '.ttf';
  let fontPath = path.join(fontsDir, fileName);
  
  // If styled font doesn't exist, fallback to regular family
  if (!fs.existsSync(fontPath)) {
    fontPath = path.join(fontsDir, `${sanitizedFamily}.ttf`);
  }
  
  // If regular family doesn't exist, fallback to Georgia
  if (!fs.existsSync(fontPath)) {
    fontPath = path.join(fontsDir, 'Georgia.ttf');
  }
  
  // Return the buffer
  return fs.readFileSync(fontPath);
}
