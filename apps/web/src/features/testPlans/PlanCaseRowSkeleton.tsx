import { Skeleton } from '@/components/ui/Skeleton';

export const PlanCaseRowSkeleton = () => (
  <li className="flex items-center gap-3 rounded-lg border border-border bg-base-100 px-4 py-3">
    <Skeleton className="size-4" />
    <Skeleton className="h-3 w-4" />
    <Skeleton className="h-3.5 flex-1" />
    <Skeleton className="size-5 rounded-md" />
  </li>
);
