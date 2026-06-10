import { FolderIcon } from "@heroicons/react/24/solid";
import type { Project } from "@testcraft/types";

import { ResourceCard } from "@/components/ui/ResourceCard";
import { ResourceListItem } from "@/components/ui/ResourceListItem";
import { formatDate } from "@/lib/format";
import type { ViewMode } from "@/stores/viewMode";

interface ProjectCardProps {
  project: Project;
  viewMode?: ViewMode;
  onEdit: () => void;
  onDelete: () => void;
}

const CountBadges = ({ project }: { project: Project }) => {
  if (project.suiteCount === undefined || project.runCount === undefined)
    return null;

  return (
    <>
      <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/50">
        {project.suiteCount} {project.suiteCount === 1 ? "suite" : "suites"}
      </span>
      <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/50">
        {project.runCount} {project.runCount === 1 ? "run" : "runs"}
      </span>
    </>
  );
};

export const ProjectCard = ({
  project,
  viewMode = "grid",
  onEdit,
  onDelete,
}: ProjectCardProps) => {
  if (viewMode === "list")
    return (
      <ResourceListItem
        to={`/projects/${project.id}`}
        onEdit={onEdit}
        onDelete={onDelete}
        label="project"
        testId="project-card"
        accentText="text-primary"
        typeIcon={<FolderIcon className="size-4" />}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold">{project.name}</span>
          <p className="truncate text-xs text-base-content/60">
            {project.description ?? (
              <span className="text-base-content/30 italic">
                No description
              </span>
            )}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <CountBadges project={project} />
          <span className="text-[11px] font-medium text-base-content/40 tabular-nums">
            {formatDate(project.createdAt)}
          </span>
        </div>
      </ResourceListItem>
    );

  return (
    <ResourceCard
      to={`/projects/${project.id}`}
      onEdit={onEdit}
      onDelete={onDelete}
      label="project"
      testId="project-card"
      cardBg="bg-base-content/[6%]"
      accentText="text-primary"
      typeIcon={<FolderIcon className="size-3.5" />}
    >
      <div className="flex flex-col gap-1.5">
        <span className="line-clamp-2 text-base leading-snug font-semibold">
          {project.name}
        </span>
        <p className="line-clamp-2 text-sm leading-relaxed text-base-content/70">
          {project.description ?? (
            <span className="text-base-content/30 italic">No description</span>
          )}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <CountBadges project={project} />
        </div>
        <span className="shrink-0 text-[11px] font-medium text-base-content/40 tabular-nums">
          {formatDate(project.createdAt)}
        </span>
      </div>
    </ResourceCard>
  );
};
