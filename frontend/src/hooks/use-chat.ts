'use client';

import { chatApi } from '@/lib/api/chat';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useConversations() {
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.listConversations,
  });

  const createConversationMutation = useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    createConversation: createConversationMutation,
  };
}

export function useConversationMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatApi.listMessages(conversationId!),
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      chatApi.sendMessage(conversationId!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    sendMessage: sendMessageMutation,
  };
}
