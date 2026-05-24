'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { FormEvent, useState } from 'react';

export function MessageInput({
  onSend,
  disabled,
  isSending,
}: {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  isSending?: boolean;
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || disabled || isSending) {
      return;
    }

    setError(null);
    try {
      await onSend(trimmed);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  return (
    <footer className="border-t border-border/60 bg-background p-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message..."
          className="min-h-[52px] resize-none"
          disabled={disabled || isSending}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit(event);
            }
          }}
        />
        <Button
          type="submit"
          size="icon-lg"
          disabled={disabled || isSending || !content.trim()}
        >
          {isSending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </footer>
  );
}
