import { Injectable } from '@nestjs/common';
import { DocumentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

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
}
