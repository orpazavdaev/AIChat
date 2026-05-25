import { APP_NAME } from '@/lib/brand';
import Image from 'next/image';
import Link from 'next/link';
import icon from '@/app/icon.png';

export function Logo({ href = '/chat' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Image
        src={icon}
        alt=""
        width={32}
        height={32}
        className="size-8 rounded-lg shadow-sm"
        priority
      />
      <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}
