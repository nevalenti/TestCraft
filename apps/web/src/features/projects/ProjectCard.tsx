import { FolderIcon } from '@heroicons/react/24/solid';
import type { Project } from '@testcraft/types';

import { MetaPill } from '@/components/ui/MetaPill';
import { ResourceCard } from '@/components/ui/ResourceCard';
import { formatDate } from '@/lib/format';

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete?: () => void;
}

const CountBadges = ({ project }: { project: Project }) => {
  if (project.suiteCount === undefined || project.runCount === undefined)
    return null;

  return (
    <>
      <MetaPill>
        {project.suiteCount} {project.suiteCount === 1 ? 'suite' : 'suites'}
      </MetaPill>
      <MetaPill>
        {project.runCount} {project.runCount === 1 ? 'run' : 'runs'}
      </MetaPill>
    </>
  );
};

export const ProjectCard = ({
  project,
  onEdit,
  onDelete,
}: ProjectCardProps) => {
  const deleteHandler = project.isOwner ? onDelete : undefined;

  return (
    <ResourceCard
      to={`/projects/${project.id}`}
      onEdit={onEdit}
      onDelete={deleteHandler}
      label="project"
      testId="project-card"
      cardBg="card-bg-primary"
      accentText="text-primary"
      typeIcon={<FolderIcon className="size-3.5" />}
    >
      <div className="flex flex-col gap-1">
        <span className="line-clamp-2 text-base leading-snug font-semibold">
          {project.name}
        </span>
        <p className="line-clamp-2 text-sm leading-relaxed text-base-content/70">
          {project.description ?? (
            <span className="text-base-content/55 italic">No description</span>
          )}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <CountBadges project={project} />
        </div>
        <span className="shrink-0 text-xs font-medium text-base-content/55 tabular-nums">
          {formatDate(project.createdAt)}
        </span>
      </div>
    </ResourceCard>
  );
};
