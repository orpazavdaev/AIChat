export type RagCitation = {
  sourceIndex: number;
  sourceRef: string;
  chunkId: string;
  documentId: string;
  documentFilename: string;
  chunkIndex: number;
  pageNumber: number;
  similarity: number;
  excerpt: string;
};

export type RagSseEvent =
  | { type: 'user_message'; userMessageId: string }
  | { type: 'citations'; citations: RagCitation[] }
  | { type: 'token'; content: string }
  | { type: 'done'; assistantMessageId: string }
  | { type: 'error'; message: string };
