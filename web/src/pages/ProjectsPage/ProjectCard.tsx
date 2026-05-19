import { Link } from "react-router";

import { PencilIcon, TrashIcon } from "@/components/ui/icons";
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
  <div className="relative bg-base-100 border border-border border-l-4 border-l-primary shadow-sm transition-all duration-150 hover:shadow-md group overflow-hidden">
    <div className="p-5 flex flex-row gap-4 items-stretch">
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="flex flex-col gap-1.5">
          <Link
            to={`/projects/${project.id}`}
            className="text-[15px] font-semibold leading-snug line-clamp-2 transition-colors hover:text-primary"
          >
            {project.name}
          </Link>
          {project.description && (
            <p className="text-base-content/50 line-clamp-2 text-sm leading-relaxed">
              {project.description}
            </p>
          )}
        </div>
        <p className="text-base-content/35 mt-3 text-xs tabular-nums">
          {formatDate(project.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="btn btn-ghost btn-sm"
          onClick={onEdit}
          aria-label="Edit project"
        >
          <PencilIcon />
        </button>
        <button
          className="btn btn-ghost btn-sm text-error"
          onClick={onDelete}
          aria-label="Delete project"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  </div>
);
