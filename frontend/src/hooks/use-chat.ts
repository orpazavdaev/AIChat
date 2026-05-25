'use client';

import { chatApi } from '@/lib/api/chat';
import type { Message } from '@/types/chat';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const conversationKeys = {
  all: ['conversations'] as const,
  detail: (id: string) => ['conversations', id] as const,
  messages: (id: string) => ['messages', id] as const,
};

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: conversationKeys.all,
    queryFn: chatApi.listConversations,
    staleTime: 30_000,
  });

  const createConversation = useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: (conversation) => {
      queryClient.setQueryData<typeof query.data>(
        conversationKeys.all,
        (current) => [conversation, ...(current ?? [])],
      );
      queryClient.setQueryData(conversationKeys.detail(conversation.id), conversation);
    },
  });

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createConversation,
  };
}

export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: conversationKeys.detail(conversationId ?? ''),
    queryFn: () => chatApi.getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 30_000,
  });
}

export function useConversationMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: conversationKeys.messages(conversationId ?? ''),
    queryFn: () => chatApi.listMessages(conversationId!),
    enabled: !!conversationId,
  });

  const appendMessage = useCallback(
    (message: Message) => {
      if (!conversationId) {
        return;
      }

      queryClient.setQueryData<Message[]>(
        conversationKeys.messages(conversationId),
        (current) => [...(current ?? []), message],
      );
    },
    [conversationId, queryClient],
  );

  const invalidate = useCallback(async () => {
    if (!conversationId) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: conversationKeys.messages(conversationId),
    });
    await queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    await queryClient.invalidateQueries({
      queryKey: conversationKeys.detail(conversationId),
    });
  }, [conversationId, queryClient]);

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    appendMessage,
    invalidate,
  };
}

export function useChatHistory(conversationId: string | undefined) {
  const conversationsState = useConversations();
  const conversationState = useConversation(conversationId ?? null);
  const messagesState = useConversationMessages(conversationId ?? null);

  return {
    ...conversationsState,
    activeConversation: conversationState.data ?? null,
    isConversationLoading: conversationState.isLoading,
    isConversationError: conversationState.isError,
    refetchConversation: conversationState.refetch,
    messages: messagesState.messages,
    isMessagesLoading: messagesState.isLoading,
    isMessagesError: messagesState.isError,
    refetchMessages: messagesState.refetch,
    appendMessage: messagesState.appendMessage,
    invalidateMessages: messagesState.invalidate,
  };
}
