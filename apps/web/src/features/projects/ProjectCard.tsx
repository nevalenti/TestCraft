import { FolderIcon } from "@heroicons/react/24/solid";
import type { Project } from "@testcraft/types";

import { MetaPill } from "@/components/ui/MetaPill";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { ResourceCard } from "@/components/ui/resource/ResourceCard";
import { PassRateTrend } from "@/features/projects/PassRateTrend";
import { cn } from "@/lib/cn";
import { passRateClass } from "@/lib/format";

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete?: () => void;
}

const CountBadges = ({ project }: { project: Project }) => {
  if (project.suite_count === undefined || project.run_count === undefined)
    return null;

  return (
    <>
      <MetaPill>
        {project.suite_count} {project.suite_count === 1 ? "suite" : "suites"}
      </MetaPill>
      <MetaPill>
        {project.run_count} {project.run_count === 1 ? "run" : "runs"}
      </MetaPill>
    </>
  );
};

export const ProjectCard = ({
  project,
  onEdit,
  onDelete,
}: ProjectCardProps) => {
  const editHandler = project.is_owner ? onEdit : undefined;
  const deleteHandler = project.is_owner ? onDelete : undefined;
  const rates = project.recent_pass_rates ?? [];
  const latestRate = rates.at(-1);

  return (
    <ResourceCard
      to={`/projects/${project.id}`}
      onEdit={editHandler}
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
        {project.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-fg-muted">
            {project.description}
          </p>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 pt-1">
        {latestRate === undefined ? (
          <p className="text-sm text-fg-subtle">No completed runs yet</p>
        ) : (
          <p className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-display text-xl font-bold tabular-nums",
                passRateClass(latestRate),
              )}
            >
              {Math.round(latestRate)}%
            </span>
            <span className="text-xs text-fg-subtle">pass rate, last run</span>
          </p>
        )}
        {rates.length > 1 && <PassRateTrend rates={rates} />}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <CountBadges project={project} />
        </div>
        <span className="shrink-0 text-xs text-fg-subtle">
          {project.last_run_at ? (
            <>
              Last run <RelativeTime value={project.last_run_at} />
            </>
          ) : (
            "No runs yet"
          )}
        </span>
      </div>
    </ResourceCard>
  );
};
