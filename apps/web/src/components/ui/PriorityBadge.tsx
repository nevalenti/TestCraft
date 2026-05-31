import { TestCasePriority } from "@testcraft/types";

const config: Record<TestCasePriority, { label: string; cls: string }> = {
  [TestCasePriority.Low]: {
    label: "Low",
    cls: "badge-ghost text-base-content/50",
  },
  [TestCasePriority.Medium]: { label: "Medium", cls: "badge-info" },
  [TestCasePriority.High]: { label: "High", cls: "badge-warning" },
  [TestCasePriority.Critical]: { label: "Critical", cls: "badge-error" },
};

export const PriorityBadge = ({
  priority,
}: {
  priority: TestCasePriority | undefined;
}) => {
  const item = priority !== undefined ? config[priority] : undefined;
  if (!item) return null;
  return (
    <span className={`badge badge-sm font-medium ${item.cls}`}>
      {item.label}
    </span>
  );
};
