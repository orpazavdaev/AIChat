export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface Conversation {
  id: string;
  title: string | null;
  documentId: string | null;
  messageCount: number;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  citations: RagCitation[] | null;
  createdAt: string;
}

export interface CreateConversationRequest {
  title?: string;
  documentId?: string;
}

export interface CreateMessageRequest {
  content: string;
}

export interface RagCitation {
  sourceIndex: number;
  sourceRef: string;
  chunkId: string;
  documentId: string;
  documentFilename: string;
  chunkIndex: number;
  pageNumber: number;
  similarity: number;
  excerpt: string;
}

export type RagSseEvent =
  | { type: 'user_message'; userMessageId: string }
  | { type: 'citations'; citations: RagCitation[] }
  | { type: 'token'; content: string }
  | { type: 'done'; assistantMessageId: string }
  | { type: 'error'; message: string };

export interface StreamingAssistantMessage {
  content: string;
  citations: RagCitation[];
}
