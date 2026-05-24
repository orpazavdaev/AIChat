import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Logo({ href = '/dashboard' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Sparkles className="size-4" />
      </span>
      <span className="text-base font-semibold tracking-tight">AIChat</span>
    </Link>
  );
}
