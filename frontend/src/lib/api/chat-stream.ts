import { getApiBaseUrl } from '@/lib/api/base-url';
import { ApiError } from '@/lib/api/client';
import { handleSessionExpired, isUnauthorizedStatus } from '@/lib/auth/session';
import { tokenStorage } from '@/lib/auth/token-storage';
import type { RagSseEvent } from '@/types/chat';

export type RagStreamHandlers = {
  onEvent: (event: RagSseEvent) => void;
  signal?: AbortSignal;
};

export async function streamRagAsk(
  conversationId: string,
  question: string,
  handlers: RagStreamHandlers,
): Promise<void> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  });

  const token = tokenStorage.getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(
      `${getApiBaseUrl()}/chat/conversations/${conversationId}/ask/stream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ question }),
        signal: handlers.signal,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(
      0,
      'Could not reach the server. It may be waking up after idle time — try again in a moment.',
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : (payload?.message ?? 'Request failed');

    if (isUnauthorizedStatus(response.status)) {
      handleSessionExpired();
    }

    throw new ApiError(response.status, message);
  }

  if (!response.body) {
    throw new Error('Streaming response body is missing');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) {
        continue;
      }

      const payload = trimmed.slice(5).trim();
      if (!payload) {
        continue;
      }

      handlers.onEvent(JSON.parse(payload) as RagSseEvent);
    }
  }
}
