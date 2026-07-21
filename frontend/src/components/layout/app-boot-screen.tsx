import { Logo } from '@/components/brand/logo';
import { Loader2 } from 'lucide-react';

export function AppBootScreen() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-muted/25 px-4">
      <Logo href="/" />
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading workspace…
      </p>
    </div>
  );
}
