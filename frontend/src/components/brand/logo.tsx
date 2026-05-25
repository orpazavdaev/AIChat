import { BrandIcon } from '@/components/brand/brand-icon';
import { APP_NAME } from '@/lib/brand';
import Link from 'next/link';

export function Logo({
  href = '/chat',
  onNavigate,
}: {
  href?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link href={href} onClick={onNavigate} className="flex items-center gap-2.5">
      <BrandIcon className="rounded-lg shadow-sm" />
      <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}
