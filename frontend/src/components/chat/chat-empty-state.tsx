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
    <div className="flex flex-1 items-center justify-center p-4 sm:p-8 animate-fade-in">
      <EmptyState
        icon={MessageSquare}
        title="Select or start a conversation"
        description="Pick a chat from history or start a new one."
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
