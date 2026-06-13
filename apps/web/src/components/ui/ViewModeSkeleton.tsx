import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { SkeletonList } from "@/components/ui/SkeletonList";
import { useViewModeStore } from "@/stores/viewMode";

export const ViewModeSkeleton = () => {
  const viewMode = useViewModeStore((state) => state.viewMode);

  return viewMode === "list" ? <SkeletonList /> : <SkeletonGrid />;
};
