import type { Label } from "@testcraft/types";

export const LabelBadge = ({ label }: { label: Label }) => (
  <span
    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
    style={{
      backgroundColor: `${label.color}22`,
      color: label.color,
      border: `1px solid ${label.color}55`,
    }}
  >
    {label.name}
  </span>
);
