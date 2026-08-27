import fs from 'fs';
import path from 'path';

export interface StorageService {
  saveFile(fileBuffer: Buffer, fileName: string, category: 'templates' | 'zip' | 'temp'): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
  getFilePath(fileUrl: string): string;
}

class LocalStorageService implements StorageService {
  private baseUploadDir = path.join(process.cwd(), 'public', 'uploads');

  constructor() {
    // Ensure base directories exist
    const categories = ['templates', 'zip', 'temp'];
    categories.forEach((cat) => {
      const dirPath = path.join(this.baseUploadDir, cat);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  async saveFile(fileBuffer: Buffer, fileName: string, category: 'templates' | 'zip' | 'temp'): Promise<string> {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}-${cleanFileName}`;
    const targetPath = path.join(this.baseUploadDir, category, uniqueName);
    
    await fs.promises.writeFile(targetPath, fileBuffer);
    
    // Return relative URL that can be accessed via Next.js public directory
    return `/uploads/${category}/${uniqueName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl.startsWith('/uploads/')) return;
      
      const relativePath = fileUrl.replace(/^\//, '');
      const absolutePath = path.join(process.cwd(), 'public', relativePath);
      
      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
      }
    } catch (error) {
      console.error(`Failed to delete file: ${fileUrl}`, error);
    }
  }

  getFilePath(fileUrl: string): string {
    const relativePath = fileUrl.replace(/^\//, '');
    return path.join(process.cwd(), 'public', relativePath);
  }
}

export const storageService: StorageService = new LocalStorageService();
