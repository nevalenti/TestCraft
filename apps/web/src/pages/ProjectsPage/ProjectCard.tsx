import { FolderIcon } from "@heroicons/react/24/solid";
import type { Project } from "@testcraft/types";

import { ResourceCard } from "@/components/ui/ResourceCard";
import { formatDate } from "@/lib/format";

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectCard = ({
  project,
  onEdit,
  onDelete,
}: ProjectCardProps) => (
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
      {project.suiteCount !== undefined && project.runCount !== undefined ? (
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/50">
            {project.suiteCount} {project.suiteCount === 1 ? "suite" : "suites"}
          </span>
          <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/50">
            {project.runCount} {project.runCount === 1 ? "run" : "runs"}
          </span>
        </div>
      ) : (
        <span />
      )}
      <span className="shrink-0 text-[11px] font-medium text-base-content/40 tabular-nums">
        {formatDate(project.createdAt)}
      </span>
    </div>
  </ResourceCard>
);
