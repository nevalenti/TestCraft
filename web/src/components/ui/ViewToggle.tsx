import { GridIcon, ListIcon } from "./icons";

export type ViewMode = "grid" | "list";

export const ViewToggle = ({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) => (
  <div className="flex border border-border overflow-hidden">
    <button
      className={`p-1.5 transition-colors ${mode === "grid" ? "bg-base-200 text-base-content" : "text-base-content/35 hover:text-base-content"}`}
      onClick={() => onChange("grid")}
      aria-label="Grid view"
    >
      <GridIcon size="size-3.5" />
    </button>
    <button
      className={`p-1.5 transition-colors border-l border-border ${mode === "list" ? "bg-base-200 text-base-content" : "text-base-content/35 hover:text-base-content"}`}
      onClick={() => onChange("list")}
      aria-label="List view"
    >
      <ListIcon size="size-3.5" />
    </button>
  </div>
);
