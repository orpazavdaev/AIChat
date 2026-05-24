import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    if (dto.documentId) {
      const document = await this.chatRepository.findDocumentByIdForUser(
        dto.documentId,
        userId,
      );
      if (!document) {
        throw new NotFoundException('Document not found');
      }
    }

    const conversation = await this.chatRepository.createConversation({
      title: dto.title ?? 'New conversation',
      user: { connect: { id: userId } },
      ...(dto.documentId
        ? { document: { connect: { id: dto.documentId } } }
        : {}),
    });

    return this.toConversationResponse(conversation, null);
  }

  async findConversations(userId: string) {
    const conversations =
      await this.chatRepository.findConversationsByUser(userId);

    return conversations.map((conversation) =>
      this.toConversationResponse(
        conversation,
        conversation.messages[0]?.content ?? null,
      ),
    );
  }

  async findMessages(userId: string, conversationId: string) {
    await this.ensureConversationAccess(conversationId, userId);

    const messages =
      await this.chatRepository.findMessagesByConversation(conversationId);

    return messages.map((message) => this.toMessageResponse(message));
  }

  async addMessage(
    userId: string,
    conversationId: string,
    dto: CreateMessageDto,
  ) {
    await this.ensureConversationAccess(conversationId, userId);

    const message = await this.chatRepository.createMessage(
      conversationId,
      dto.content,
    );

    return this.toMessageResponse(message);
  }

  private async ensureConversationAccess(conversationId: string, userId: string) {
    const conversation = await this.chatRepository.findConversationByIdForUser(
      conversationId,
      userId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private toConversationResponse(
    conversation: {
      id: string;
      title: string | null;
      documentId: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    lastMessage: string | null,
  ) {
    return {
      id: conversation.id,
      title: conversation.title,
      documentId: conversation.documentId,
      lastMessage,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private toMessageResponse(message: {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: Date;
  }) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    };
  }
}
