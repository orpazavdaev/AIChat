'use client';

import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { useConversations } from '@/hooks/use-chat';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();
  const { createConversation } = useConversations();

  const handleCreate = async () => {
    const conversation = await createConversation.mutateAsync({});
    router.push(`/chat/${conversation.id}`);
  };

  return (
    <ChatEmptyState
      onCreate={handleCreate}
      isCreating={createConversation.isPending}
    />
  );
}
