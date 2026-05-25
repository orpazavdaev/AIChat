'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';

export function ChatEmptyState({
  onCreate,
  isCreating,
}: {
  onCreate: () => void;
  isCreating: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-center">
      <div className="max-w-sm space-y-4">
        <MessageSquare className="mx-auto size-10 text-muted-foreground" />
        <div className="space-y-2">
          <p className="font-medium">Select or start a conversation</p>
          <p className="text-sm text-muted-foreground">
            Your messages are saved per conversation. Switch anytime from the
            sidebar.
          </p>
        </div>
        <Button onClick={onCreate} disabled={isCreating}>
          <Plus className="size-4" />
          New conversation
        </Button>
      </div>
    </div>
  );
}
