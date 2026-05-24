import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { FileStorageService } from '../storage/file-storage.service';

@Injectable()
export class PdfParserService {
  constructor(private readonly fileStorageService: FileStorageService) {}

  async extractFromBuffer(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text.trim();
    } catch {
      throw new InternalServerErrorException('Failed to extract text from PDF');
    } finally {
      await parser.destroy();
    }
  }

  async extractFromPath(relativePath: string): Promise<string> {
    const buffer = await this.fileStorageService.read(relativePath);
    return this.extractFromBuffer(buffer);
  }
}
