import { Injectable } from '@nestjs/common';
import { DocumentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import type { SimilarChunk } from './retrieval/similar-chunk.types';

type SimilarChunkRow = {
  id: string;
  documentId: string;
  index: number;
  content: string;
  similarity: number;
};

@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.DocumentCreateInput) {
    return this.prisma.document.create({ data });
  }

  updateExtraction(id: string, content: string | null, status: DocumentStatus) {
    return this.prisma.document.update({
      where: { id },
      data: { content, status },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.prisma.document.findFirst({
      where: { id, userId },
    });
  }

  findMetadataByIdsForUser(userId: string, ids: string[]) {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.document.findMany({
      where: { userId, id: { in: ids } },
      select: { id: true, filename: true },
    });
  }

  replaceChunks(
    documentId: string,
    chunks: { index: number; content: string }[],
  ) {
    return this.prisma.$transaction([
      this.prisma.documentChunk.deleteMany({ where: { documentId } }),
      ...(chunks.length > 0
        ? [
            this.prisma.documentChunk.createMany({
              data: chunks.map((chunk) => ({
                documentId,
                index: chunk.index,
                content: chunk.content,
              })),
            }),
          ]
        : []),
    ]);
  }

  findChunksByDocumentId(documentId: string) {
    return this.prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { index: 'asc' },
      select: { id: true, index: true, content: true },
    });
  }

  async setChunkEmbeddings(
    updates: { id: string; embedding: number[] }[],
  ): Promise<void> {
    await this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.$executeRawUnsafe(
          'UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2::uuid',
          `[${update.embedding.join(',')}]`,
          update.id,
        ),
      ),
    );
  }

  async searchSimilarChunks(
    userId: string,
    embedding: number[],
    limit: number,
    documentId?: string,
  ): Promise<SimilarChunk[]> {
    const vector = `[${embedding.join(',')}]`;
    const rows = documentId
      ? await this.prisma.$queryRawUnsafe<SimilarChunkRow[]>(
          `
          SELECT
            c.id,
            c."documentId",
            c.index,
            c.content,
            1 - (c.embedding <=> $1::vector) AS similarity
          FROM "DocumentChunk" c
          INNER JOIN "Document" d ON d.id = c."documentId"
          WHERE d."userId" = $2::uuid
            AND c."documentId" = $3::uuid
            AND c.embedding IS NOT NULL
            AND d.status = 'READY'
          ORDER BY c.embedding <=> $1::vector ASC
          LIMIT $4
          `,
          vector,
          userId,
          documentId,
          limit,
        )
      : await this.prisma.$queryRawUnsafe<SimilarChunkRow[]>(
          `
          SELECT
            c.id,
            c."documentId",
            c.index,
            c.content,
            1 - (c.embedding <=> $1::vector) AS similarity
          FROM "DocumentChunk" c
          INNER JOIN "Document" d ON d.id = c."documentId"
          WHERE d."userId" = $2::uuid
            AND c.embedding IS NOT NULL
            AND d.status = 'READY'
          ORDER BY c.embedding <=> $1::vector ASC
          LIMIT $3
          `,
          vector,
          userId,
          limit,
        );

    return rows.map((row) => ({
      id: row.id,
      documentId: row.documentId,
      index: Number(row.index),
      content: row.content,
      similarity: Number(row.similarity),
    }));
  }
}
