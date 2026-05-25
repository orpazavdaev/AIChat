'use client';

import { MessageInput } from '@/components/chat/message-input';
import { MessageList } from '@/components/chat/message-list';
import { AlertBanner } from '@/components/ui/alert-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { bidiTextProps } from '@/lib/text-direction';
import { useChatHistory } from '@/hooks/use-chat';
import { useRagStream } from '@/hooks/use-rag-stream';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export function ChatConversationView({
  conversationId,
}: {
  conversationId: string;
}) {
  const {
    activeConversation,
    isConversationLoading,
    isConversationError,
    refetchConversation,
    messages,
    isMessagesLoading,
    isMessagesError,
    refetchMessages,
  } = useChatHistory(conversationId);
  const {
    ask,
    isStreaming,
    streamingMessage,
    pendingQuestion,
    error: streamError,
  } = useRagStream(conversationId);

  const handleSend = async (content: string) => {
    await ask(content);
  };

  const loadError =
    (isConversationError && !activeConversation) ||
    (isMessagesError && messages.length === 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-border/60 px-4 py-3 md:px-6 md:py-4">
        <Link
          href="/chat"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
        >
          <ChevronLeft className="size-4" />
          History
        </Link>
        {isConversationLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <div className="animate-fade-in">
            <h2 {...bidiTextProps('truncate text-base font-semibold tracking-tight')}>
              {activeConversation?.title ?? 'Conversation'}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeConversation?.messageCount ?? 0} messages
              {activeConversation?.documentId ? ' · Document scoped' : ''}
            </p>
          </div>
        )}
      </header>
      {loadError && (
        <div className="shrink-0 px-4 pt-4 md:px-6">
          <AlertBanner
            message="Could not load this conversation."
            onRetry={() => {
              void refetchConversation();
              void refetchMessages();
            }}
          />
        </div>
      )}
      <MessageList
        messages={messages}
        isLoading={isMessagesLoading && !loadError}
        pendingQuestion={pendingQuestion}
        streamingMessage={streamingMessage}
        isStreaming={isStreaming}
      />
      <MessageInput
        onSend={handleSend}
        isSending={isStreaming}
        error={streamError}
        disabled={loadError}
      />
    </div>
  );
}
