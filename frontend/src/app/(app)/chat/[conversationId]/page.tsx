import { ChatConversationView } from '@/components/chat/chat-conversation-view';

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ChatConversationView conversationId={conversationId} />;
}
