import {
  CheckIcon,
  MinusIcon,
  NoEntryIcon,
  XIcon,
} from "@/components/ui/icons";
import { TestResultStatus } from "@/types";

const config: Record<
  TestResultStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  [TestResultStatus.Passed]: {
    label: "Passed",
    cls: "badge-success",
    icon: <CheckIcon size="size-3" />,
  },
  [TestResultStatus.Failed]: {
    label: "Failed",
    cls: "badge-error",
    icon: <XIcon size="size-3" />,
  },
  [TestResultStatus.Blocked]: {
    label: "Blocked",
    cls: "badge-warning",
    icon: <NoEntryIcon size="size-3" />,
  },
  [TestResultStatus.Skipped]: {
    label: "Skipped",
    cls: "badge-neutral",
    icon: <MinusIcon size="size-3" />,
  },
};

export const StatusBadge = ({ status }: { status: TestResultStatus }) => {
  const { label, cls, icon } = config[status];
  return (
    <span className={`badge ${cls} gap-1 font-medium`}>
      {icon}
      {label}
    </span>
  );
};
