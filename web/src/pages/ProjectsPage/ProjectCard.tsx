import { FolderIcon } from "@heroicons/react/24/solid";

import { ResourceCard } from "@/components/ui/ResourceCard";
import { formatDate } from "@/lib/format";
import type { ProjectDto } from "@/types";

interface ProjectCardProps {
  project: ProjectDto;
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
    cardBg="bg-base-content/[6%]"
    accentText="text-base-content/50"
    typeIcon={<FolderIcon className="size-3.5" />}
  >
    <div className="flex flex-col gap-1.5">
      <span className="text-base font-semibold leading-snug line-clamp-2">
        {project.name}
      </span>
      <p className="text-base-content/70 line-clamp-2 text-sm leading-relaxed">
        {project.description ?? (
          <span className="italic text-base-content/30">No description</span>
        )}
      </p>
    </div>
    <div className="mt-4 flex items-center justify-between gap-2">
      {project.suiteCount !== undefined && project.runCount !== undefined ? (
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-base-content/50 bg-base-200">
            {project.suiteCount} {project.suiteCount === 1 ? "suite" : "suites"}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-base-content/50 bg-base-200">
            {project.runCount} {project.runCount === 1 ? "run" : "runs"}
          </span>
        </div>
      ) : (
        <span />
      )}
      <span className="text-[11px] tabular-nums text-base-content/40 font-medium shrink-0">
        {formatDate(project.createdAt)}
      </span>
    </div>
  </ResourceCard>
);
