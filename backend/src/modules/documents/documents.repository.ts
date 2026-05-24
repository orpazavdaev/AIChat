import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.DocumentCreateInput) {
    return this.prisma.document.create({ data });
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
}
