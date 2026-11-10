import { PILL_TAB, PILL_TAB_ACTIVE } from "@/components/ui/subNavStyles";
import { cn } from "@/lib/cn";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export const SegmentedControl = <T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<T>) => (
  <div
    role="group"
    aria-label={label}
    className={cn("flex items-center gap-1", className)}
  >
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className={cn(
          PILL_TAB,
          "cursor-pointer",
          value === option.value && PILL_TAB_ACTIVE,
        )}
      >
        {option.icon}
        {option.label}
      </button>
    ))}
  </div>
);
