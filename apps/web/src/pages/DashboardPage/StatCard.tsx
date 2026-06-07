export const StatCard = ({
  label,
  value,
  icon,
  isLoading,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  isLoading: boolean;
  accent: string;
}) => (
  <div className="rounded-lg border border-base-content/20 bg-base-100 p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-[11px] font-semibold tracking-widest text-base-content/50 uppercase">
        {label}
      </span>
      <span className={accent}>{icon}</span>
    </div>
    {isLoading ? (
      <div className="h-9 w-16 skeleton rounded" />
    ) : (
      <p className={`font-display text-4xl font-bold ${accent}`}>{value}</p>
    )}
  </div>
);
