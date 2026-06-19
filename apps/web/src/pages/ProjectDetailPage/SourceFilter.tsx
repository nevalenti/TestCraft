import { cn } from "@/lib/cn";

interface SourceFilterProps {
  sources: string[];
  counts: Record<string, number>;
  value: string | null;
  onChange: (source: string | null) => void;
}

export const SourceFilter = ({
  sources,
  counts,
  value,
  onChange,
}: SourceFilterProps) => {
  if (sources.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {value !== null && (
        <button
          onClick={() => onChange(null)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-base-100 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-base-200"
        >
          All suites
        </button>
      )}
      {sources.map((source) => (
        <button
          key={source}
          onClick={() => onChange(value === source ? null : source)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
            value === source
              ? "border-base-content/40 bg-base-200 shadow-sm"
              : "border-border bg-base-100 hover:bg-base-200",
          )}
        >
          <span className="text-sm font-medium text-base-content/75">
            {source}
          </span>
          <span className="text-sm font-bold text-base-content/75 tabular-nums">
            {counts[source]}
          </span>
        </button>
      ))}
    </div>
  );
};
