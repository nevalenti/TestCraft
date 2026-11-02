import { cn } from "@/lib/cn";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

interface RelativeTimeProps {
  value: string | null | undefined;
  className?: string;
}

export const RelativeTime = ({ value, className }: RelativeTimeProps) =>
  value ? (
    <time
      dateTime={value}
      title={formatDateTime(value)}
      className={cn("whitespace-nowrap tabular-nums", className)}
    >
      {formatRelativeTime(value)}
    </time>
  ) : (
    <span className={className}>—</span>
  );
