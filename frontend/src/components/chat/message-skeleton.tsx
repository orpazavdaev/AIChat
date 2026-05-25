import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function MessageListSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={cn('flex', index % 2 === 0 ? 'justify-start' : 'justify-end')}
        >
          <Skeleton
            className={cn(
              'h-[4.5rem] rounded-2xl',
              index % 2 === 0 ? 'w-[72%]' : 'w-[48%]',
            )}
          />
        </div>
      ))}
    </div>
  );
}
