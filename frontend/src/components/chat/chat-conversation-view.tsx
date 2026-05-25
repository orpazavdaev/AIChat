'use client';

import { MessageInput } from '@/components/chat/message-input';
import { MessageList } from '@/components/chat/message-list';
import { AlertBanner } from '@/components/ui/alert-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatHistory } from '@/hooks/use-chat';
import { useRagStream } from '@/hooks/use-rag-stream';

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
      <header className="shrink-0 border-b border-border/60 px-6 py-4">
        {isConversationLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <div className="animate-fade-in">
            <h2 className="truncate text-base font-semibold tracking-tight">
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
        <div className="shrink-0 px-6 pt-4">
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
