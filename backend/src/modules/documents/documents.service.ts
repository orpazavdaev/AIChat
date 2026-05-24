import { Injectable } from '@nestjs/common';
import { DocumentsRepository } from './documents.repository';

@Injectable()
export class DocumentsService {
  constructor(private readonly documentsRepository: DocumentsRepository) {}
}
