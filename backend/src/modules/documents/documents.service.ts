import { Injectable } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { AiService } from '../../common/ai/ai.service';
import { chunkText } from '../../common/utils';
import { DocumentsRepository } from './documents.repository';
import { PdfParserService } from './extraction/pdf-parser.service';
import { VectorSearchService } from './retrieval/vector-search.service';
import { FileStorageService } from './storage/file-storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly fileStorageService: FileStorageService,
    private readonly pdfParserService: PdfParserService,
    private readonly aiService: AiService,
    private readonly vectorSearchService: VectorSearchService,
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

  search(userId: string, query: string, documentId?: string) {
    return this.vectorSearchService.search(userId, query, documentId);
  }

  private async extractAndStore(documentId: string, source: Buffer) {
    try {
      const content = await this.pdfParserService.extractFromBuffer(source);
      const textChunks = chunkText(content);

      if (textChunks.length === 0) {
        throw new Error('No extractable text in PDF');
      }

      await this.documentsRepository.replaceChunks(documentId, textChunks);

      const storedChunks =
        await this.documentsRepository.findChunksByDocumentId(documentId);
      const embeddings = await this.aiService.embedTexts(
        storedChunks.map((chunk) => chunk.content),
      );

      await this.documentsRepository.setChunkEmbeddings(
        storedChunks.map((chunk, index) => ({
          id: chunk.id,
          embedding: embeddings[index],
        })),
      );

      return this.documentsRepository.updateExtraction(
        documentId,
        content,
        DocumentStatus.READY,
      );
    } catch {
      await this.documentsRepository.replaceChunks(documentId, []);
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
