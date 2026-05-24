'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';
import { useEffect, useRef } from 'react';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function MessageBubble({ message }: { message: Message }) {
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
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            'mt-1 text-[10px]',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </article>
  );
}

export function MessageList({
  messages,
  isLoading,
}: {
  messages: Message[];
  isLoading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          Send a message to start the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
