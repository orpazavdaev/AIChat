'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquare, Plus } from 'lucide-react';

export function ChatEmptyState({
  onCreate,
  isCreating,
}: {
  onCreate: () => void;
  isCreating: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8 animate-fade-in">
      <EmptyState
        icon={MessageSquare}
        title="Select or start a conversation"
        description="Your messages are saved per conversation. Switch anytime from the sidebar."
        action={
          <Button onClick={onCreate} disabled={isCreating}>
            <Plus className="size-4" />
            New conversation
          </Button>
        }
      />
    </div>
  );
}
