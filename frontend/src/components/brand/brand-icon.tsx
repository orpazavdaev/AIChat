import { cn } from '@/lib/utils';

export function BrandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn('size-8 shrink-0', className)}
    >
      <rect width="32" height="32" rx="8" fill="url(#docwise-gradient)" />
      <path
        d="M10 8.5A1.5 1.5 0 0 1 11.5 7H17l4.5 4.5V22.5A1.5 1.5 0 0 1 20 24H11.5A1.5 1.5 0 0 1 10 22.5v-14Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path d="M17 7v4.5H21.5" fill="white" fillOpacity="0.55" />
      <path
        d="M13 14h6M13 17h4"
        stroke="#4F46E5"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M21.5 9.5 23 8l1.5 1.5L23 11l-1.5-1.5Z"
        fill="#C4B5FD"
      />
      <defs>
        <linearGradient
          id="docwise-gradient"
          x1="4"
          y1="4"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );
}
