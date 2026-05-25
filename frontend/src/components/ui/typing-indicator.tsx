import { cn } from '@/lib/utils';

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-1.5 py-1', className)}
      aria-label="Assistant is typing"
    >
      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/80 [animation-delay:0ms]" />
      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/80 [animation-delay:150ms]" />
      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/80 [animation-delay:300ms]" />
    </div>
  );
}
