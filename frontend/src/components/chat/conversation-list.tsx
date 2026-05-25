'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertBanner } from '@/components/ui/alert-banner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { bidiTextProps } from '@/lib/text-direction';
import type { Conversation } from '@/types/chat';
import { History, Plus } from 'lucide-react';
import Link from 'next/link';

function formatPreview(value: string | null) {
  if (!value) {
    return 'No messages yet';
  }
  return value.length > 72 ? `${value.slice(0, 72)}...` : value;
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  isError,
  onRetry,
  onCreate,
  isCreating,
  className,
}: {
  conversations: Conversation[];
  activeConversationId?: string;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCreate: () => void;
  isCreating: boolean;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        'flex h-full w-72 shrink-0 flex-col border-r border-border/60 bg-muted/15 dark:bg-muted/10',
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
        <h2 className="text-sm font-semibold tracking-tight">History</h2>
        <Button size="sm" variant="outline" onClick={onCreate} disabled={isCreating}>
          <Plus className="size-4" />
          New
        </Button>
      </header>
      <ScrollArea className="scrollbar-thin flex-1">
        <div className="space-y-1 p-2">
          {isError && (
            <div className="p-2">
              <AlertBanner
                message="Could not load conversations."
                onRetry={onRetry}
              />
            </div>
          )}
          {isLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[72px] w-full rounded-xl" />
            ))}
          {!isLoading && !isError && conversations.length === 0 && (
            <EmptyState
              icon={History}
              title="No conversations yet"
              description="Start a new chat to ask questions about your documents."
              className="py-10"
            />
          )}
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/chat/${conversation.id}`}
              className={cn(
                'block rounded-xl px-3 py-3 transition-all duration-200 hover:bg-background/80',
                activeConversationId === conversation.id &&
                  'bg-background shadow-sm ring-1 ring-border/60 dark:bg-card',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p {...bidiTextProps('truncate text-sm font-medium leading-snug')}>
                  {conversation.title ?? 'Untitled'}
                </p>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {formatRelativeTime(conversation.updatedAt)}
                </span>
              </div>
              <p {...bidiTextProps('mt-1 truncate text-xs leading-relaxed text-muted-foreground')}>
                {formatPreview(conversation.lastMessage)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {conversation.messageCount} message
                {conversation.messageCount === 1 ? '' : 's'}
              </p>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
