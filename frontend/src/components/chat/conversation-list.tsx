'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { Conversation } from '@/types/chat';
import { MessageSquare, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function formatPreview(value: string | null) {
  if (!value) {
    return 'No messages yet';
  }
  return value.length > 60 ? `${value.slice(0, 60)}...` : value;
}

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  onCreate,
  isCreating,
}: {
  conversations: Conversation[];
  activeConversationId?: string;
  isLoading: boolean;
  onCreate: () => void;
  isCreating: boolean;
}) {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-border/60 bg-muted/20">
      <header className="flex items-center justify-between border-b border-border/60 p-4">
        <h2 className="text-sm font-semibold">Conversations</h2>
        <Button size="sm" variant="outline" onClick={onCreate} disabled={isCreating}>
          <Plus className="size-4" />
          New
        </Button>
      </header>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {isLoading &&
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          {!isLoading && conversations.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/80 p-6 text-center">
              <MessageSquare className="mx-auto mb-2 size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          )}
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/chat/${conversation.id}`}
              className={cn(
                'block rounded-xl px-3 py-3 transition-colors hover:bg-background',
                activeConversationId === conversation.id &&
                  'bg-background shadow-sm',
              )}
            >
              <p className="truncate text-sm font-medium">
                {conversation.title ?? 'Untitled'}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {formatPreview(conversation.lastMessage)}
              </p>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
