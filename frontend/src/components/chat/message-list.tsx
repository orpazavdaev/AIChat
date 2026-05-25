'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Message, RagCitation, StreamingAssistantMessage } from '@/types/chat';
import { useEffect, useRef } from 'react';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function CitationsList({ citations }: { citations: RagCitation[] }) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <ul className="mt-2 space-y-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
      {citations.map((citation) => (
        <li key={citation.chunkId}>
          {citation.documentFilename} · chunk {citation.chunkIndex} ·{' '}
          {Math.round(citation.similarity * 100)}%
        </li>
      ))}
    </ul>
  );
}

function MessageBubble({
  message,
  citations,
  isTyping,
}: {
  message: Pick<Message, 'role' | 'content' | 'createdAt'> & { id?: string };
  citations?: RagCitation[];
  isTyping?: boolean;
}) {
  const isUser = message.role === 'USER';

  return (
    <article className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border/60 bg-background text-foreground',
        )}
      >
        {isTyping && !message.content ? (
          <div className="flex items-center gap-1 py-1">
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        {!isUser && citations && <CitationsList citations={citations} />}
        {!isTyping && (
          <p
            className={cn(
              'mt-1 text-[10px]',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
          >
            {formatTime(message.createdAt)}
          </p>
        )}
      </div>
    </article>
  );
}

export function MessageList({
  messages,
  isLoading,
  pendingQuestion,
  streamingMessage,
  isStreaming,
}: {
  messages: Message[];
  isLoading: boolean;
  pendingQuestion?: string | null;
  streamingMessage?: StreamingAssistantMessage | null;
  isStreaming?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingQuestion, streamingMessage, isStreaming]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn(
              'h-16 rounded-2xl',
              index % 2 === 0 ? 'w-2/3' : 'ml-auto w-1/2',
            )}
          />
        ))}
      </div>
    );
  }

  const showEmpty =
    messages.length === 0 && !pendingQuestion && !streamingMessage;

  if (showEmpty) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          Ask a question about your documents
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {pendingQuestion && (
        <MessageBubble
          message={{
            role: 'USER',
            content: pendingQuestion,
            createdAt: new Date().toISOString(),
          }}
        />
      )}
      {(isStreaming || streamingMessage) && (
        <MessageBubble
          message={{
            role: 'ASSISTANT',
            content: streamingMessage?.content ?? '',
            createdAt: new Date().toISOString(),
          }}
          citations={streamingMessage?.citations}
          isTyping={isStreaming && !streamingMessage?.content}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
