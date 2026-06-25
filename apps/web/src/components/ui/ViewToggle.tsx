import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/cn";
import { useViewModeStore } from "@/stores/viewMode";

export const ViewToggle = () => {
  const viewMode = useViewModeStore((state) => state.viewMode);
  const setViewMode = useViewModeStore((state) => state.setViewMode);

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-base-200 p-0.5">
      <button
        type="button"
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition-all",
          viewMode === "grid"
            ? "bg-base-100 text-base-content shadow-sm"
            : "text-base-content/40 hover:text-base-content/70",
        )}
        onClick={() => setViewMode("grid")}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
      >
        <Squares2X2Icon className="size-3.5" />
      </button>
      <button
        type="button"
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition-all",
          viewMode === "list"
            ? "bg-base-100 text-base-content shadow-sm"
            : "text-base-content/40 hover:text-base-content/70",
        )}
        onClick={() => setViewMode("list")}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
      >
        <ListBulletIcon className="size-3.5" />
      </button>
    </div>
  );
};
