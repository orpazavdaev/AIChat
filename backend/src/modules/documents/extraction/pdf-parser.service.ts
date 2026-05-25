import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { FileStorageService } from '../storage/file-storage.service';

export type PdfPageText = {
  pageNumber: number;
  text: string;
};

export type PdfExtractResult = {
  text: string;
  pages: PdfPageText[];
};

@Injectable()
export class PdfParserService {
  constructor(private readonly fileStorageService: FileStorageService) {}

  async extractFromBuffer(buffer: Buffer): Promise<PdfExtractResult> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      const pages = result.pages
        .map((page) => ({
          pageNumber: page.num,
          text: page.text.trim(),
        }))
        .filter((page) => page.text.length > 0);

      return {
        text: result.text.trim(),
        pages,
      };
    } catch {
      throw new InternalServerErrorException('Failed to extract text from PDF');
    } finally {
      await parser.destroy();
    }
  }

  async extractFromPath(relativePath: string): Promise<PdfExtractResult> {
    const buffer = await this.fileStorageService.read(relativePath);
    return this.extractFromBuffer(buffer);
  }
}
