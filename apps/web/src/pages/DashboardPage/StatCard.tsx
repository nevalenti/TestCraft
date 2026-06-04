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
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-base-content/50">
        {label}
      </span>
      <span className={accent}>{icon}</span>
    </div>
    {isLoading ? (
      <div className="skeleton h-9 w-16 rounded" />
    ) : (
      <p className={`text-4xl font-bold font-display ${accent}`}>{value}</p>
    )}
  </div>
);
