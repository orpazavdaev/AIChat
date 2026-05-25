import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { EmbeddingService } from './embeddings/embedding.service';
import { PdfParserService } from './extraction/pdf-parser.service';
import { VectorSearchService } from './retrieval/vector-search.service';
import { FileStorageService } from './storage/file-storage.service';

@Module({
  imports: [AuthModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    FileStorageService,
    PdfParserService,
    EmbeddingService,
    VectorSearchService,
  ],
  exports: [DocumentsService, DocumentsRepository, VectorSearchService],
})
export class DocumentsModule {}
