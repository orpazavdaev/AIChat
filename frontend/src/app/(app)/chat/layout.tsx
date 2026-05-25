'use client';

import { ConversationList } from '@/components/chat/conversation-list';
import { useConversations } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

function getActiveConversationId(pathname: string) {
  const match = pathname.match(/^\/chat\/([^/]+)$/);
  return match?.[1];
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeConversationId = getActiveConversationId(pathname);
  const { conversations, isLoading, isError, refetch, createConversation } =
    useConversations();

  const handleCreateConversation = async () => {
    const conversation = await createConversation.mutateAsync({});
    router.push(`/chat/${conversation.id}`);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header
        className={cn(
          'shrink-0 border-b border-border/60 px-4 py-4 md:px-8 md:py-6',
          activeConversationId && 'hidden md:block',
        )}
      >
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversation history across your document Q&amp;A sessions
        </p>
      </header>
      <div className="flex min-h-0 flex-1">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          onCreate={handleCreateConversation}
          isCreating={createConversation.isPending}
          className={cn(
            activeConversationId ? 'hidden md:flex' : 'flex w-full md:w-72',
          )}
        />
        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col bg-background transition-colors duration-200',
            !activeConversationId && 'hidden md:flex',
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
