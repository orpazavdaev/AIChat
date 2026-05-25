import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  TaskType,
} from '@google/generative-ai';

const DEFAULT_CHAT_MODEL = 'gemini-2.5-flash';
const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 1536;
const EMBED_BATCH_SIZE = 100;

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly configService: ConfigService) {}

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const model = this.getEmbeddingModel();
    const results: number[][] = [];

    for (let index = 0; index < texts.length; index += EMBED_BATCH_SIZE) {
      const batch = texts.slice(index, index + EMBED_BATCH_SIZE);
      const { embeddings } = await model.batchEmbedContents({
        requests: batch.map((text) => ({
          content: { role: 'user', parts: [{ text }] },
          taskType: TaskType.RETRIEVAL_DOCUMENT,
        })),
      });

      results.push(
        ...embeddings.map((embedding) =>
          this.toStorageEmbedding(embedding.values),
        ),
      );
    }

    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    const model = this.getEmbeddingModel();
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text }] },
      taskType: TaskType.RETRIEVAL_QUERY,
    });

    return this.toStorageEmbedding(result.embedding.values);
  }

  private toStorageEmbedding(values: number[]): number[] {
    const truncated = values.slice(0, EMBEDDING_DIMENSIONS);
    const magnitude = Math.sqrt(
      truncated.reduce((sum, value) => sum + value * value, 0),
    );

    if (magnitude === 0) {
      return truncated;
    }

    return truncated.map((value) => value / magnitude);
  }

  async generateText(system: string, user: string): Promise<string> {
    let answer = '';

    for await (const chunk of this.generateTextStream(system, user)) {
      answer += chunk;
    }

    return answer;
  }

  async *generateTextStream(
    system: string,
    user: string,
  ): AsyncGenerator<string> {
    const model = this.getChatModel(system);
    const streamResult = await model.generateContentStream(user);

    for await (const chunk of streamResult.stream) {
      const text = chunk.text();

      if (text) {
        yield text;
      }
    }
  }

  private getGenAI(): GoogleGenerativeAI {
    if (this.genAI) {
      return this.genAI;
    }

    const apiKey = this.configService.get<string>('gemini.apiKey');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    return this.genAI;
  }

  private getChatModel(systemInstruction: string) {
    return this.getGenAI().getGenerativeModel({
      model: this.getChatModelName(),
      systemInstruction,
      generationConfig: { temperature: 0 },
    });
  }

  private getEmbeddingModel() {
    return this.getGenAI().getGenerativeModel({
      model: this.getEmbeddingModelName(),
    });
  }

  private getChatModelName(): string {
    return (
      this.configService.get<string>('gemini.chatModel') ?? DEFAULT_CHAT_MODEL
    );
  }

  private getEmbeddingModelName(): string {
    return (
      this.configService.get<string>('gemini.embeddingModel') ??
      DEFAULT_EMBEDDING_MODEL
    );
  }
}
