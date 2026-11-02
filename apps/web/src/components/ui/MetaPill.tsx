import { cn } from "@/lib/cn";

interface MetaPillProps {
  children: React.ReactNode;
  className?: string;
}

export const MetaPill = ({ children, className }: MetaPillProps) => (
  <span
    className={cn(
      "rounded-full bg-base-200 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-fg-muted",
      className,
    )}
  >
    {children}
  </span>
);
