import { cn } from "@/lib/cn";

interface PassRateTrendProps {
  rates: number[];
  className?: string;
}

const formatRate = (rate: number) => `${Math.round(rate)}%`;

const runLabel = (runsAgo: number) => {
  if (runsAgo === 0) return "Latest run";
  return runsAgo === 1 ? "1 run earlier" : `${runsAgo} runs earlier`;
};

export const PassRateTrend = ({ rates, className }: PassRateTrendProps) => (
  <div
    role="img"
    aria-label={`Pass rate of the last ${rates.length} completed runs: ${rates.map(formatRate).join(", ")}`}
    className={cn("flex h-7 items-end gap-0.5", className)}
  >
    {rates.map((rate, index) => {
      const isLatest = index === rates.length - 1;
      const runsAgo = rates.length - 1 - index;

      return (
        <span
          key={index}
          title={`${runLabel(runsAgo)}: ${formatRate(rate)}`}
          className={cn(
            "w-1.5 rounded-t-sm",
            isLatest ? "bg-primary" : "bg-base-content/30",
          )}
          style={{ height: `${Math.max(rate, 6)}%` }}
        />
      );
    })}
  </div>
);
