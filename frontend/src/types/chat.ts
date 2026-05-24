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
