export type RagCitation = {
  chunkId: string;
  documentId: string;
  documentFilename: string;
  chunkIndex: number;
  similarity: number;
  excerpt: string;
};

export type RagSseEvent =
  | { type: 'user_message'; userMessageId: string }
  | { type: 'citations'; citations: RagCitation[] }
  | { type: 'token'; content: string }
  | { type: 'done'; assistantMessageId: string }
  | { type: 'error'; message: string };
