import {
  CheckIcon,
  MinusIcon,
  NoSymbolIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { TestResultStatus } from "@testcraft/types";

import { cn } from "@/lib/cn";

const config: Record<
  TestResultStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  [TestResultStatus.Passed]: {
    label: "Passed",
    cls: "bg-success/12 text-success border-success/25",
    icon: <CheckIcon className="size-3" />,
  },
  [TestResultStatus.Failed]: {
    label: "Failed",
    cls: "bg-error/12 text-error border-error/25",
    icon: <XMarkIcon className="size-3" />,
  },
  [TestResultStatus.Blocked]: {
    label: "Blocked",
    cls: "bg-warning/12 text-warning border-warning/25",
    icon: <NoSymbolIcon className="size-3" />,
  },
  [TestResultStatus.Skipped]: {
    label: "Skipped",
    cls: "bg-base-content/6 text-base-content/65 border-base-content/15",
    icon: <MinusIcon className="size-3" />,
  },
};

export const StatusBadge = ({ status }: { status: TestResultStatus }) => {
  const { label, cls, icon } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        cls,
      )}
    >
      {icon}
      {label}
    </span>
  );
};
