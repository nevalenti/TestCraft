import { cn } from "@/lib/cn";

export const StatCard = ({
  label,
  value,
  icon,
  accent,
  iconBg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  iconBg?: string;
}) => (
  <div className="rounded-xl border border-border bg-base-100 p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <span className="text-[11px] font-semibold tracking-widest text-base-content/45 uppercase">
        {label}
      </span>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          iconBg ?? "bg-base-200",
          accent,
        )}
      >
        {icon}
      </span>
    </div>
    <p
      className={cn(
        "font-display text-[2.5rem] leading-none font-bold",
        accent,
      )}
    >
      {value}
    </p>
  </div>
);
