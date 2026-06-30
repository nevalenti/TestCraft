import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/cn";

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  colorVar: string;
  cardBg?: string;
  to?: string;
  description?: string;
};

const cardBase =
  "relative overflow-hidden rounded-2xl p-5 transition-[box-shadow] duration-200 ease-out";

export const StatCard = ({
  label,
  value,
  icon,
  accent,
  colorVar,
  cardBg,
  to,
  description,
}: StatCardProps) => {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold tracking-widest text-base-content/45 uppercase">
          {label}
        </p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl bg-current/8",
            accent,
          )}
        >
          {icon}
        </span>
      </div>

      <p
        className={cn(
          "mt-3 font-display text-[2.5rem] leading-none font-extrabold tabular-nums tracking-tight",
          accent,
        )}
      >
        {value}
      </p>

      {to ? (
        <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-base-content/40">
          View all
          <ArrowRightIcon className="size-3" />
        </p>
      ) : (
        description && (
          <p className="mt-3 text-xs text-base-content/40">{description}</p>
        )
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        style={{ "--card-glow": `var(${colorVar})` } as React.CSSProperties}
        className={cn(
          cardBase,
          cardBg ?? "border border-border bg-base-100 shadow-sm",
          "group hover:shadow-[0_0_0_1px_oklch(from_var(--card-glow)_l_c_h/0.55),0_0_6px_0px_oklch(from_var(--card-glow)_l_c_h/0.2)]",
        )}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        cardBase,
        cardBg ?? "border border-border bg-base-100 shadow-sm",
      )}
    >
      {inner}
    </div>
  );
};
