import { Injectable } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { DocumentsRepository } from './documents.repository';
import { PdfParserService } from './extraction/pdf-parser.service';
import { FileStorageService } from './storage/file-storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly fileStorageService: FileStorageService,
    private readonly pdfParserService: PdfParserService,
  ) {}

  async upload(userId: string, file: Express.Multer.File) {
    const stored = await this.fileStorageService.save(userId, file);

    const document = await this.documentsRepository.create({
      filename: stored.filename,
      path: stored.path,
      status: DocumentStatus.UPLOADED,
      user: { connect: { id: userId } },
    });

    return this.toResponse(await this.extractAndStore(document.id, file.buffer));
  }

  async findAllByUser(userId: string) {
    const documents = await this.documentsRepository.findAllByUser(userId);
    return documents.map((document) => this.toResponse(document));
  }

  private async extractAndStore(documentId: string, source: Buffer) {
    try {
      const content = await this.pdfParserService.extractFromBuffer(source);
      return this.documentsRepository.updateExtraction(
        documentId,
        content,
        DocumentStatus.READY,
      );
    } catch {
      return this.documentsRepository.updateExtraction(
        documentId,
        null,
        DocumentStatus.FAILED,
      );
    }
  }

  private toResponse(document: {
    id: string;
    filename: string;
    path: string;
    status: DocumentStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: document.id,
      filename: document.filename,
      path: document.path,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
