import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DocumentsRepository } from '../../documents/documents.repository';
import { VectorSearchService } from '../../documents/retrieval/vector-search.service';
import type { SimilarChunk } from '../../documents/retrieval/similar-chunk.types';
import { ChatRepository } from '../chat.repository';
import { buildNoContextAnswer, buildRagPrompt } from './prompt-builder';

const CHAT_MODEL = 'gpt-4o-mini';

export type RagCitation = {
  chunkId: string;
  documentId: string;
  documentFilename: string;
  chunkIndex: number;
  similarity: number;
  excerpt: string;
};

export type RagChatResult = {
  answer: string;
  citations: RagCitation[];
  userMessageId: string;
  assistantMessageId: string;
};

@Injectable()
export class RagChatService {
  private client: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly chatRepository: ChatRepository,
    private readonly vectorSearchService: VectorSearchService,
    private readonly documentsRepository: DocumentsRepository,
  ) {}

  async ask(
    userId: string,
    conversationId: string,
    question: string,
  ): Promise<RagChatResult> {
    const conversation = await this.chatRepository.findConversationByIdForUser(
      conversationId,
      userId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const chunks = await this.vectorSearchService.search(
      userId,
      question,
      conversation.documentId ?? undefined,
    );

    const userMessage = await this.chatRepository.createUserMessage(
      conversationId,
      question,
    );

    if (chunks.length === 0) {
      const answer = buildNoContextAnswer();
      const assistantMessage = await this.chatRepository.createAssistantMessage(
        conversationId,
        answer,
      );

      return {
        answer,
        citations: [],
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
      };
    }

    const citations = await this.buildCitations(userId, chunks);
    const prompt = buildRagPrompt(
      question,
      citations.map((citation, index) => ({
        sourceId: `source-${index + 1}`,
        documentFilename: citation.documentFilename,
        chunkIndex: citation.chunkIndex,
        content: citation.excerpt,
      })),
    );

    const answer = await this.complete(prompt.system, prompt.user);
    const assistantMessage = await this.chatRepository.createAssistantMessage(
      conversationId,
      answer,
    );

    return {
      answer,
      citations,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
    };
  }

  private async buildCitations(
    userId: string,
    chunks: SimilarChunk[],
  ): Promise<RagCitation[]> {
    const documentIds = [...new Set(chunks.map((chunk) => chunk.documentId))];
    const documents = await this.documentsRepository.findMetadataByIdsForUser(
      userId,
      documentIds,
    );
    const filenameById = new Map(
      documents.map((document) => [document.id, document.filename]),
    );

    return chunks.map((chunk) => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentFilename: filenameById.get(chunk.documentId) ?? 'Unknown',
      chunkIndex: chunk.index,
      similarity: chunk.similarity,
      excerpt: chunk.content,
    }));
  }

  private async complete(system: string, user: string): Promise<string> {
    const response = await this.getClient().chat.completions.create({
      model: this.getModel(),
      temperature: 0,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      return buildNoContextAnswer();
    }

    return content;
  }

  private getClient(): OpenAI {
    if (this.client) {
      return this.client;
    }

    const apiKey = this.configService.get<string>('openai.apiKey');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  private getModel(): string {
    return this.configService.get<string>('openai.chatModel') ?? CHAT_MODEL;
  }
}
