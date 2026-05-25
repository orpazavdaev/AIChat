export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface Conversation {
  id: string;
  title: string | null;
  documentId: string | null;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
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
  chunkId: string;
  documentId: string;
  documentFilename: string;
  chunkIndex: number;
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
