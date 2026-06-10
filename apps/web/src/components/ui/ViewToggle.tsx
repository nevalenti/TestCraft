import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/cn";
import { useViewModeStore } from "@/stores/viewMode";

export const ViewToggle = () => {
  const viewMode = useViewModeStore((state) => state.viewMode);
  const setViewMode = useViewModeStore((state) => state.setViewMode);

  return (
    <div className="join">
      <button
        type="button"
        className={cn(
          "btn join-item btn-sm",
          viewMode === "grid" && "btn-active",
        )}
        onClick={() => setViewMode("grid")}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
      >
        <Squares2X2Icon className="size-4" />
      </button>
      <button
        type="button"
        className={cn(
          "btn join-item btn-sm",
          viewMode === "list" && "btn-active",
        )}
        onClick={() => setViewMode("list")}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
      >
        <ListBulletIcon className="size-4" />
      </button>
    </div>
  );
};
