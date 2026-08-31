import { cn } from '@/lib/cn';

export const Skeleton = ({ className }: { className: string }) => (
  <div
    className={cn(
      'motion-safe:animate-pulse rounded-md bg-base-content/10',
      className,
    )}
  />
);
