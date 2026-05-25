import { Injectable } from '@nestjs/common';
import { AiService } from '../../../common/ai/ai.service';
import { DocumentsRepository } from '../documents.repository';
import type { SimilarChunk } from './similar-chunk.types';

const TOP_K = 5;

export type { SimilarChunk } from './similar-chunk.types';

@Injectable()
export class VectorSearchService {
  constructor(
    private readonly aiService: AiService,
    private readonly documentsRepository: DocumentsRepository,
  ) {}

  async search(
    userId: string,
    query: string,
    documentId?: string,
  ): Promise<SimilarChunk[]> {
    const queryEmbedding = await this.aiService.embedQuery(query);

    return this.documentsRepository.searchSimilarChunks(
      userId,
      queryEmbedding,
      TOP_K,
      documentId,
    );
  }
}
