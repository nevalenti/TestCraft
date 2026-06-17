import { cn } from "@/lib/cn";

export const StatCard = ({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) => (
  <div className="rounded-lg border border-base-content/20 bg-base-100 p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-[11px] font-semibold tracking-widest text-base-content/50 uppercase">
        {label}
      </span>
      <span className={cn(accent)}>{icon}</span>
    </div>
    <p className={cn("font-display text-4xl font-bold", accent)}>{value}</p>
  </div>
);
