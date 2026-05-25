'use client';

import { streamRagAsk } from '@/lib/api/chat-stream';
import type { RagCitation, StreamingAssistantMessage } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

export function useRagStream(conversationId: string | null) {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingAssistantMessage | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    async (question: string) => {
      if (!conversationId) {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setPendingQuestion(question);
      setStreamingMessage({ content: '', citations: [] });
      setError(null);

      try {
        await streamRagAsk(conversationId, question, {
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === 'citations') {
              setStreamingMessage((current) =>
                current
                  ? { ...current, citations: event.citations }
                  : { content: '', citations: event.citations },
              );
              return;
            }

            if (event.type === 'token') {
              setStreamingMessage((current) =>
                current
                  ? { ...current, content: current.content + event.content }
                  : { content: event.content, citations: [] },
              );
              return;
            }

            if (event.type === 'error') {
              throw new Error(event.message);
            }
          },
        });

        await queryClient.invalidateQueries({
          queryKey: ['messages', conversationId],
        });
        await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to get response');
      } finally {
        setIsStreaming(false);
        setPendingQuestion(null);
        setStreamingMessage(null);
        abortRef.current = null;
      }
    },
    [conversationId, queryClient],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    ask,
    cancel,
    isStreaming,
    streamingMessage,
    pendingQuestion,
    error,
  };
}

export type { RagCitation };
