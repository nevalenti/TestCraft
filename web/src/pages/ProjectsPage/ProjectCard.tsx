import { Link } from "react-router";

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
  <ResourceCard onEdit={onEdit} onDelete={onDelete} label="project">
    <div className="flex flex-col gap-1.5">
      <Link
        to={`/projects/${project.id}`}
        className="text-[15px] font-semibold leading-snug line-clamp-2 transition-colors hover:text-primary"
      >
        {project.name}
      </Link>
      {project.description && (
        <p className="text-base-content/55 line-clamp-2 text-sm leading-relaxed">
          {project.description}
        </p>
      )}
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
