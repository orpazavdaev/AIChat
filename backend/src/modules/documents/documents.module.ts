import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { PdfParserService } from './extraction/pdf-parser.service';
import { FileStorageService } from './storage/file-storage.service';

@Module({
  imports: [AuthModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    FileStorageService,
    PdfParserService,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
