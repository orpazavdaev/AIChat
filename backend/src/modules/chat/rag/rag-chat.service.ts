import { Injectable, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { AiService } from '../../../common/ai/ai.service';
import { DocumentsRepository } from '../../documents/documents.repository';
import { VectorSearchService } from '../../documents/retrieval/vector-search.service';
import type { SimilarChunk } from '../../documents/retrieval/similar-chunk.types';
import { ChatRepository } from '../chat.repository';
import { buildNoContextAnswer, buildRagPrompt } from './prompt-builder';
import type { RagCitation, RagSseEvent } from './rag-chat.types';
import { initSse, writeSseEvent } from './sse-writer';

export type { RagCitation } from './rag-chat.types';

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
  constructor(
    private readonly aiService: AiService,
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
      : await this.aiService.generateText(
          prepared.prompt!.system,
          prepared.prompt!.user,
        );

    const finalAnswer = answer.trim() || buildNoContextAnswer();
    const assistantMessage = await this.chatRepository.createAssistantMessage(
      conversationId,
      finalAnswer,
    );

    return {
      answer: finalAnswer,
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

    for await (const token of this.aiService.generateTextStream(
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
}
