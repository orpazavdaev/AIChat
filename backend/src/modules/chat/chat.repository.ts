import { Injectable } from '@nestjs/common';
import { MessageRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  createConversation(data: Prisma.ConversationCreateInput) {
    return this.prisma.conversation.create({ data });
  }

  findConversationsByUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  findConversationByIdForUser(id: string, userId: string) {
    return this.prisma.conversation.findFirst({
      where: { id, userId },
    });
  }

  findDocumentByIdForUser(id: string, userId: string) {
    return this.prisma.document.findFirst({
      where: { id, userId },
    });
  }

  findMessagesByConversation(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createMessage(conversationId: string, content: string) {
    const message = await this.prisma.message.create({
      data: {
        content,
        role: MessageRole.USER,
        conversation: { connect: { id: conversationId } },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }
}
