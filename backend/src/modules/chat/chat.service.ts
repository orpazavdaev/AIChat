import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChatRepository } from './chat.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { RagChatService } from './rag/rag-chat.service';
import type { RagCitation } from './rag/rag-chat.types';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly ragChatService: RagChatService,
  ) {}

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

    return this.toConversationResponse({
      ...conversation,
      _count: { messages: 0 },
      messages: [],
    });
  }

  async findConversations(userId: string) {
    const conversations =
      await this.chatRepository.findConversationsByUser(userId);

    return conversations.map((conversation) =>
      this.toConversationResponse(conversation),
    );
  }

  async findConversation(userId: string, conversationId: string) {
    const conversation = await this.ensureConversationAccess(
      conversationId,
      userId,
    );
    const messages =
      await this.chatRepository.findMessagesByConversation(conversationId);
    const lastMessage = messages.at(-1);

    return this.toConversationResponse(
      {
        ...conversation,
        _count: { messages: messages.length },
        messages: lastMessage ? [lastMessage] : [],
      },
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

  ask(userId: string, conversationId: string, question: string) {
    return this.ragChatService.ask(userId, conversationId, question);
  }

  askStream(
    userId: string,
    conversationId: string,
    question: string,
    res: Response,
  ) {
    return this.ragChatService.askStream(
      userId,
      conversationId,
      question,
      res,
    );
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

  private toConversationResponse(conversation: {
    id: string;
    title: string | null;
    documentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: { messages: number };
    messages: { role: string; content: string }[];
  }) {
    const latest = conversation.messages[0];

    return {
      id: conversation.id,
      title: conversation.title,
      documentId: conversation.documentId,
      messageCount: conversation._count.messages,
      lastMessage: latest ? this.formatLastMessage(latest) : null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private formatLastMessage(message: { role: string; content: string }) {
    const prefix = message.role === 'USER' ? 'You: ' : 'AI: ';
    const text = message.content.trim();

    if (text.length <= 80) {
      return `${prefix}${text}`;
    }

    return `${prefix}${text.slice(0, 80)}...`;
  }

  private toMessageResponse(message: {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    citations?: unknown | null;
    createdAt: Date;
  }) {
    const citations =
      message.role === 'ASSISTANT' && message.citations
        ? (message.citations as RagCitation[])
        : null;

    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      citations,
      createdAt: message.createdAt,
    };
  }
}
