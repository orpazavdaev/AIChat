'use client';

import { MessageListSkeleton } from '@/components/chat/message-skeleton';
import { MessageCitations } from '@/components/chat/message-citations';
import { MessageContent } from '@/components/chat/message-content';
import { EmptyState } from '@/components/ui/empty-state';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { cn } from '@/lib/utils';
import type { Message, RagCitation, StreamingAssistantMessage } from '@/types/chat';
import { MessageSquare } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function MessageBubble({
  message,
  citations,
  isTyping,
  animate,
}: {
  message: Pick<Message, 'role' | 'content' | 'createdAt'> & { id?: string };
  citations?: RagCitation[] | null;
  isTyping?: boolean;
  animate?: boolean;
}) {
  const [activeSourceRef, setActiveSourceRef] = useState<string | null>(null);
  const isUser = message.role === 'USER';
  const sourceList = citations ?? [];

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
          'max-w-[min(92%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-shadow sm:max-w-[min(80%,42rem)]',
          isUser
            ? 'bg-primary text-primary-foreground shadow-primary/15'
            : 'border border-border/50 bg-card text-foreground dark:border-border/60 dark:bg-card/80',
        )}
      >
        {isTyping && !message.content ? (
          <TypingIndicator />
        ) : (
          <MessageContent
            content={message.content}
            citations={isUser ? undefined : sourceList}
            onSourceClick={setActiveSourceRef}
          />
        )}
        {!isUser && !isTyping && sourceList.length > 0 && (
          <MessageCitations
            citations={sourceList}
            activeSourceRef={activeSourceRef}
            onSourceSelect={setActiveSourceRef}
          />
        )}
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
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 animate-fade-in">
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
      className="scrollbar-thin flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 md:px-6 md:py-6"
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          citations={message.role === 'ASSISTANT' ? message.citations : null}
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
