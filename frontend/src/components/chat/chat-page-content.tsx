'use client';

import { ConversationList } from '@/components/chat/conversation-list';
import { MessageInput } from '@/components/chat/message-input';
import { MessageList } from '@/components/chat/message-list';
import { useConversationMessages, useConversations } from '@/hooks/use-chat';
import { useRagStream } from '@/hooks/use-rag-stream';
import { useRouter } from 'next/navigation';

export function ChatPageContent({
  conversationId,
}: {
  conversationId?: string;
}) {
  const router = useRouter();
  const { conversations, isLoading, createConversation } = useConversations();
  const { messages, isLoading: messagesLoading } =
    useConversationMessages(conversationId ?? null);
  const {
    ask,
    isStreaming,
    streamingMessage,
    pendingQuestion,
    error: streamError,
  } = useRagStream(conversationId ?? null);

  const handleCreateConversation = async () => {
    const conversation = await createConversation.mutateAsync({});
    router.push(`/chat/${conversation.id}`);
  };

  const handleSend = async (content: string) => {
    if (!conversationId) {
      return;
    }
    await ask(content);
  };

  return (
    <section className="flex h-[calc(100vh-0px)] flex-col">
      <header className="border-b border-border/60 px-8 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask questions about your documents with AI-powered answers
        </p>
      </header>
      <div className="flex min-h-0 flex-1">
        <ConversationList
          conversations={conversations}
          activeConversationId={conversationId}
          isLoading={isLoading}
          onCreate={handleCreateConversation}
          isCreating={createConversation.isPending}
        />
        <section className="flex min-w-0 flex-1 flex-col bg-background">
          {!conversationId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div className="space-y-2">
                <p className="font-medium">Select or start a conversation</p>
                <p className="text-sm text-muted-foreground">
                  Create a new chat to ask your first question
                </p>
              </div>
            </div>
          ) : (
            <>
              <MessageList
                messages={messages}
                isLoading={messagesLoading}
                pendingQuestion={pendingQuestion}
                streamingMessage={streamingMessage}
                isStreaming={isStreaming}
              />
              <MessageInput
                onSend={handleSend}
                isSending={isStreaming}
                error={streamError}
              />
            </>
          )}
        </section>
      </div>
    </section>
  );
}
