'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, Server } from 'lucide-react';

export function BackendWakeBanner({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 border-b border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100',
        className,
      )}
    >
      <Server className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">Waking up the server…</p>
        <p className="mt-0.5 leading-relaxed text-amber-900/80 dark:text-amber-100/75">
          The API is starting after idle time. The UI is ready — data will load
          automatically in about a minute.
        </p>
      </div>
      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-amber-500/30 bg-background/60"
          onClick={onRetry}
        >
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
