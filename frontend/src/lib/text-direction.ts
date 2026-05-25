import { cn } from '@/lib/utils';

export const BIDI_TEXT_CLASS =
  'whitespace-pre-wrap text-start [unicode-bidi:plaintext]';

export function bidiTextProps(className?: string) {
  return {
    dir: 'auto' as const,
    className: cn(BIDI_TEXT_CLASS, className),
  };
}
