'use client';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { bidiTextProps } from '@/lib/text-direction';
import { Loader2, Send } from 'lucide-react';
import { FormEvent, useState } from 'react';

export function MessageInput({
  onSend,
  disabled,
  isSending,
  error: externalError,
}: {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  isSending?: boolean;
  error?: string | null;
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const displayError = error ?? externalError;

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
    <footer className="shrink-0 border-t border-border/60 bg-background/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm md:px-4 md:py-4">
      <form
        onSubmit={handleSubmit}
        className={cn(
          'flex gap-3 rounded-2xl border border-border/60 bg-muted/20 p-2 transition-shadow focus-within:border-ring/50 focus-within:ring-2 focus-within:ring-ring/20 dark:bg-muted/15',
          disabled && 'opacity-60',
        )}
      >
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Ask about your documents..."
          dir="auto"
          className={cn(
            'min-h-[52px] flex-1 resize-none border-0 bg-transparent text-start shadow-none [unicode-bidi:plaintext] focus-visible:ring-0',
          )}
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
          className="shrink-0 self-end"
          disabled={disabled || isSending || !content.trim()}
        >
          {isSending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
      {displayError && (
        <div className="mt-3">
          <AlertBanner message={displayError} />
        </div>
      )}
    </footer>
  );
}
