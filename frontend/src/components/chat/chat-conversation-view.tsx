'use client';

import { MessageInput } from '@/components/chat/message-input';
import { MessageList } from '@/components/chat/message-list';
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
    messages,
    isMessagesLoading,
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-border/60 px-6 py-4">
        {isConversationLoading ? (
          <Skeleton className="h-6 w-48" />
        ) : (
          <>
            <h2 className="truncate text-base font-semibold">
              {activeConversation?.title ?? 'Conversation'}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeConversation?.messageCount ?? 0} messages
              {activeConversation?.documentId ? ' · Document scoped' : ''}
            </p>
          </>
        )}
      </header>
      <MessageList
        messages={messages}
        isLoading={isMessagesLoading}
        pendingQuestion={pendingQuestion}
        streamingMessage={streamingMessage}
        isStreaming={isStreaming}
      />
      <MessageInput
        onSend={handleSend}
        isSending={isStreaming}
        error={streamError}
      />
    </div>
  );
}
