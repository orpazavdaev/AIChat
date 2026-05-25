import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';

@Injectable()
export class EmbeddingService {
  private client: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {}

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await this.getClient().embeddings.create({
      model: this.getModel(),
      input: texts,
    });

    return response.data
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding);
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
    return (
      this.configService.get<string>('openai.embeddingModel') ?? EMBEDDING_MODEL
    );
  }
}
