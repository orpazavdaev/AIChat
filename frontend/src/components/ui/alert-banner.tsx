import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function AlertBanner({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive dark:bg-destructive/12',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="leading-relaxed">{message}</p>
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={onRetry}
          >
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
