import { apiClient } from '@/lib/api/client';
import type {
  Conversation,
  CreateConversationRequest,
  CreateMessageRequest,
  Message,
} from '@/types/chat';

export const chatApi = {
  listConversations() {
    return apiClient<Conversation[]>('/chat/conversations');
  },

  getConversation(conversationId: string) {
    return apiClient<Conversation>(`/chat/conversations/${conversationId}`);
  },

  createConversation(data: CreateConversationRequest = {}) {
    return apiClient<Conversation>('/chat/conversations', {
      method: 'POST',
      body: data,
    });
  },

  listMessages(conversationId: string) {
    return apiClient<Message[]>(
      `/chat/conversations/${conversationId}/messages`,
    );
  },

  sendMessage(conversationId: string, data: CreateMessageRequest) {
    return apiClient<Message>(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: data,
      },
    );
  },
};
