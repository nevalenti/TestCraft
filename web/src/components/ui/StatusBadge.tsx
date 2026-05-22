import {
  CheckIcon,
  MinusIcon,
  NoSymbolIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

import { TestResultStatus } from "@/types";

const config: Record<
  TestResultStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  [TestResultStatus.Passed]: {
    label: "Passed",
    cls: "badge-success",
    icon: <CheckIcon className="size-3" />,
  },
  [TestResultStatus.Failed]: {
    label: "Failed",
    cls: "badge-error",
    icon: <XMarkIcon className="size-3" />,
  },
  [TestResultStatus.Blocked]: {
    label: "Blocked",
    cls: "badge-warning",
    icon: <NoSymbolIcon className="size-3" />,
  },
  [TestResultStatus.Skipped]: {
    label: "Skipped",
    cls: "badge-neutral",
    icon: <MinusIcon className="size-3" />,
  },
};

export const StatusBadge = ({ status }: { status: TestResultStatus }) => {
  const { label, cls, icon } = config[status];
  return (
    <span className={`badge badge-sm ${cls} gap-1 font-medium`}>
      {icon}
      {label}
    </span>
  );
};
