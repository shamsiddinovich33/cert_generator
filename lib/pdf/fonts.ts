import fs from 'fs';
import path from 'path';

export interface LoadedFonts {
  georgia: Buffer;
  georgiaItalic: Buffer;
  georgiaBold: Buffer;
  georgiaBoldItalic: Buffer; // Added Bold Italic
  bahnschrift: Buffer;
}

export function checkFontsAvailable(): { georgia: boolean; bahnschrift: boolean } {
  const georgiaPath = path.join(process.cwd(), 'public', 'fonts', 'Georgia.ttf');
  const bahnschriftPath = path.join(process.cwd(), 'public', 'fonts', 'Bahnschrift.ttf');

  return {
    georgia: fs.existsSync(georgiaPath),
    bahnschrift: fs.existsSync(bahnschriftPath),
  };
}

export function loadFontFiles(): LoadedFonts {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  const georgiaPath = path.join(fontsDir, 'Georgia.ttf');
  const georgiaItalicPath = path.join(fontsDir, 'Georgia-Italic.ttf');
  const georgiaBoldPath = path.join(fontsDir, 'Georgia-Bold.ttf');
  const georgiaBoldItalicPath = path.join(fontsDir, 'Georgia-BoldItalic.ttf');
  const bahnschriftPath = path.join(fontsDir, 'Bahnschrift.ttf');

  if (!fs.existsSync(georgiaPath)) {
    throw new Error('Georgia font is not available.');
  }

  if (!fs.existsSync(bahnschriftPath)) {
    throw new Error('Bahnschrift font is not available.');
  }

  const georgia = fs.readFileSync(georgiaPath);
  const bahnschrift = fs.readFileSync(bahnschriftPath);
  
  // Load bold and italic variants with fallbacks to regular
  const georgiaItalic = fs.existsSync(georgiaItalicPath) 
    ? fs.readFileSync(georgiaItalicPath) 
    : georgia;
    
  const georgiaBold = fs.existsSync(georgiaBoldPath) 
    ? fs.readFileSync(georgiaBoldPath) 
    : georgia;

  const georgiaBoldItalic = fs.existsSync(georgiaBoldItalicPath) 
    ? fs.readFileSync(georgiaBoldItalicPath) 
    : georgiaBold; // Fallback to bold if bold-italic doesn't exist

  return { georgia, georgiaItalic, georgiaBold, georgiaBoldItalic, bahnschrift };
}
