import { Link } from "react-router";

import { ResourceListRow } from "@/components/ui/ResourceListRow";
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
  <ResourceListRow
    date={formatDate(project.createdAt)}
    onEdit={onEdit}
    onDelete={onDelete}
    label="project"
  >
    <Link
      to={`/projects/${project.id}`}
      className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1"
    >
      {project.name}
    </Link>
    {(project.description || project.suiteCount !== undefined) && (
      <p className="text-xs text-base-content/45 mt-0.5 line-clamp-1">
        {project.description ??
          `${project.suiteCount} ${project.suiteCount === 1 ? "suite" : "suites"} · ${project.runCount} ${project.runCount === 1 ? "run" : "runs"}`}
      </p>
    )}
  </ResourceListRow>
);
