type SuiteEntry = { name: string; value: number; fill: string };

export const SuiteTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: SuiteEntry[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0);
  return (
    <div className="min-w-40 rounded-xl border border-border bg-base-100 px-3.5 py-2.5 text-sm shadow-xl">
      <p className="mb-2 max-w-52 truncate font-semibold">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-6"
        >
          <span className="flex items-center gap-1.5 text-xs text-base-content/85">
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ background: entry.fill }}
            />
            {entry.name}
          </span>
          <span className="text-xs font-medium tabular-nums">
            {entry.value}
          </span>
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5">
        <span className="text-xs text-base-content/65">Total</span>
        <span className="text-xs font-bold tabular-nums">{total}</span>
      </div>
    </div>
  );
};
