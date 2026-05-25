import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import OpenAI from 'openai';
import { DocumentsRepository } from '../../documents/documents.repository';
import { VectorSearchService } from '../../documents/retrieval/vector-search.service';
import type { SimilarChunk } from '../../documents/retrieval/similar-chunk.types';
import { ChatRepository } from '../chat.repository';
import { buildNoContextAnswer, buildRagPrompt } from './prompt-builder';
import type { RagCitation, RagSseEvent } from './rag-chat.types';
import { initSse, writeSseEvent } from './sse-writer';

export type { RagCitation } from './rag-chat.types';

const CHAT_MODEL = 'gpt-4o-mini';

export type RagChatResult = {
  answer: string;
  citations: RagCitation[];
  userMessageId: string;
  assistantMessageId: string;
};

type PreparedAsk = {
  userMessageId: string;
  citations: RagCitation[];
  noContext: boolean;
  prompt: { system: string; user: string } | null;
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
    const prepared = await this.prepare(userId, conversationId, question);
    const answer = prepared.noContext
      ? buildNoContextAnswer()
      : await this.complete(
          prepared.prompt!.system,
          prepared.prompt!.user,
        );

    const assistantMessage = await this.chatRepository.createAssistantMessage(
      conversationId,
      answer,
    );

    return {
      answer,
      citations: prepared.citations,
      userMessageId: prepared.userMessageId,
      assistantMessageId: assistantMessage.id,
    };
  }

  async askStream(
    userId: string,
    conversationId: string,
    question: string,
    res: Response,
  ): Promise<void> {
    initSse(res);

    try {
      const prepared = await this.prepare(userId, conversationId, question);

      writeSseEvent(res, {
        type: 'user_message',
        userMessageId: prepared.userMessageId,
      });
      writeSseEvent(res, {
        type: 'citations',
        citations: prepared.citations,
      });

      const answer = await this.collectStreamedAnswer(prepared, (token) => {
        writeSseEvent(res, { type: 'token', content: token });
      });

      const assistantMessage =
        await this.chatRepository.createAssistantMessage(
          conversationId,
          answer,
        );

      writeSseEvent(res, {
        type: 'done',
        assistantMessageId: assistantMessage.id,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Stream failed';
      this.writeError(res, message);
    } finally {
      res.end();
    }
  }

  private async prepare(
    userId: string,
    conversationId: string,
    question: string,
  ): Promise<PreparedAsk> {
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
      return {
        userMessageId: userMessage.id,
        citations: [],
        noContext: true,
        prompt: null,
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

    return {
      userMessageId: userMessage.id,
      citations,
      noContext: false,
      prompt,
    };
  }

  private async collectStreamedAnswer(
    prepared: PreparedAsk,
    onToken: (token: string) => void,
  ): Promise<string> {
    if (prepared.noContext) {
      const answer = buildNoContextAnswer();
      onToken(answer);
      return answer;
    }

    let answer = '';

    for await (const token of this.streamComplete(
      prepared.prompt!.system,
      prepared.prompt!.user,
    )) {
      answer += token;
      onToken(token);
    }

    if (!answer.trim()) {
      const fallback = buildNoContextAnswer();
      if (!answer) {
        onToken(fallback);
      }
      return fallback;
    }

    return answer;
  }

  private writeError(res: Response, message: string): void {
    const event: RagSseEvent = { type: 'error', message };
    writeSseEvent(res, event);
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
    let answer = '';

    for await (const token of this.streamComplete(system, user)) {
      answer += token;
    }

    if (!answer.trim()) {
      return buildNoContextAnswer();
    }

    return answer;
  }

  private async *streamComplete(
    system: string,
    user: string,
  ): AsyncGenerator<string> {
    const stream = await this.getClient().chat.completions.create({
      model: this.getModel(),
      temperature: 0,
      stream: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
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
