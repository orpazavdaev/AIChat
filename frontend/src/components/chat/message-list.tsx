'use client';

import { MessageListSkeleton } from '@/components/chat/message-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { cn } from '@/lib/utils';
import type { Message, RagCitation, StreamingAssistantMessage } from '@/types/chat';
import { MessageSquare } from 'lucide-react';
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
    <ul className="mt-2.5 space-y-1 border-t border-border/50 pt-2.5 text-[11px] leading-relaxed text-muted-foreground">
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
  animate,
}: {
  message: Pick<Message, 'role' | 'content' | 'createdAt'> & { id?: string };
  citations?: RagCitation[];
  isTyping?: boolean;
  animate?: boolean;
}) {
  const isUser = message.role === 'USER';

  return (
    <article
      className={cn(
        'flex',
        isUser ? 'justify-end' : 'justify-start',
        animate && 'animate-fade-in-up',
      )}
    >
      <div
        className={cn(
          'max-w-[min(80%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-shadow',
          isUser
            ? 'bg-primary text-primary-foreground shadow-primary/15'
            : 'border border-border/50 bg-card text-foreground dark:border-border/60 dark:bg-card/80',
        )}
      >
        {isTyping && !message.content ? (
          <TypingIndicator />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        {!isUser && citations && <CitationsList citations={citations} />}
        {!isTyping && (
          <p
            className={cn(
              'mt-1.5 text-[10px] tabular-nums',
              isUser ? 'text-primary-foreground/65' : 'text-muted-foreground',
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pendingQuestion, streamingMessage?.content, isStreaming]);

  if (isLoading) {
    return <MessageListSkeleton />;
  }

  const showEmpty =
    messages.length === 0 && !pendingQuestion && !streamingMessage;

  if (showEmpty) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 animate-fade-in">
        <EmptyState
          icon={MessageSquare}
          title="Start the conversation"
          description="Ask a question about your uploaded documents. Answers include citations from your PDFs."
          className="py-8"
        />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="scrollbar-thin flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          animate={index >= messages.length - 2}
        />
      ))}
      {pendingQuestion && (
        <MessageBubble
          message={{
            role: 'USER',
            content: pendingQuestion,
            createdAt: new Date().toISOString(),
          }}
          animate
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
          animate
        />
      )}
      <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
    </div>
  );
}
