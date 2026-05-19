import { Link } from "react-router";

import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import type { ProjectDto } from "@/types";

interface ProjectListItemProps {
  project: ProjectDto;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectListItem = ({
  project,
  onEdit,
  onDelete,
}: ProjectListItemProps) => (
  <div className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 border-l-4 border-l-primary bg-base-100 group hover:bg-base-200/40 transition-colors">
    <div className="flex-1 min-w-0">
      <Link
        to={`/projects/${project.id}`}
        className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1"
      >
        {project.name}
      </Link>
      {project.description && (
        <p className="text-xs text-base-content/45 line-clamp-1 mt-0.5">
          {project.description}
        </p>
      )}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <p className="text-xs text-base-content/35 tabular-nums hidden sm:block">
        {formatDate(project.createdAt)}
      </p>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="btn btn-ghost btn-xs"
          onClick={onEdit}
          aria-label="Edit project"
        >
          <PencilIcon size="size-3.5" />
        </button>
        <button
          className="btn btn-ghost btn-xs text-error"
          onClick={onDelete}
          aria-label="Delete project"
        >
          <TrashIcon size="size-3.5" />
        </button>
      </div>
    </div>
  </div>
);
