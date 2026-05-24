import { ChatPageContent } from '@/components/chat/chat-page-content';

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ChatPageContent conversationId={conversationId} />;
}
