import { Injectable } from '@nestjs/common';
import { DocumentsRepository } from '../documents.repository';
import { EmbeddingService } from '../embeddings/embedding.service';
import type { SimilarChunk } from './similar-chunk.types';

const TOP_K = 5;

export type { SimilarChunk } from './similar-chunk.types';

@Injectable()
export class VectorSearchService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly documentsRepository: DocumentsRepository,
  ) {}

  async search(
    userId: string,
    query: string,
    documentId?: string,
  ): Promise<SimilarChunk[]> {
    const [queryEmbedding] = await this.embeddingService.embedTexts([query]);

    return this.documentsRepository.searchSimilarChunks(
      userId,
      queryEmbedding,
      TOP_K,
      documentId,
    );
  }
}
