import { Injectable } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { DocumentsRepository } from './documents.repository';
import { FileStorageService } from './storage/file-storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async upload(userId: string, file: Express.Multer.File) {
    const stored = await this.fileStorageService.save(userId, file);

    const document = await this.documentsRepository.create({
      filename: stored.filename,
      path: stored.path,
      status: DocumentStatus.UPLOADED,
      user: { connect: { id: userId } },
    });

    return this.toResponse(document);
  }

  async findAllByUser(userId: string) {
    const documents = await this.documentsRepository.findAllByUser(userId);
    return documents.map((document) => this.toResponse(document));
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
