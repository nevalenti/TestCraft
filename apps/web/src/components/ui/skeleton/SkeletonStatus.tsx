import { cn } from "@/lib/cn";

interface SkeletonStatusProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

export const SkeletonStatus = ({
  label,
  className,
  children,
}: SkeletonStatusProps) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className={cn("animate-[skeleton-in_200ms_ease-out_both]", className)}
  >
    <span className="sr-only">{label}</span>
    {children}
  </div>
);
