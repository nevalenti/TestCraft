import { cn } from '@/lib/cn';

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
    <div className="mb-4 flex flex-wrap gap-1.5">
      {value !== null && (
        <button
          onClick={() => onChange(null)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-base-100 px-2.5 py-1.5 text-xs font-medium text-base-content/85 transition-colors hover:bg-base-200 hover:text-base-content"
        >
          All
        </button>
      )}
      {sources.map((source) => (
        <button
          key={source}
          onClick={() => onChange(value === source ? null : source)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
            value === source
              ? 'border-base-content/25 bg-base-200 shadow-sm text-base-content'
              : 'border-border bg-base-100 text-base-content/80 hover:bg-base-200 hover:text-base-content',
          )}
        >
          <span>{source}</span>
          <span className="font-bold text-base-content/80 tabular-nums">
            {counts[source]}
          </span>
        </button>
      ))}
    </div>
  );
};
