import { HeartIcon } from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import type { Project } from "@testcraft/types";

import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { PassRateTrend } from "@/features/projects/PassRateTrend";
import { cn } from "@/lib/cn";

const PROJECT_LIMIT = 6;

const passRateBadgeClass = (rate: number) => {
  if (rate >= 80) return "bg-success/15 text-success";
  if (rate >= 50) return "bg-warning/15 text-warning";
  return "bg-error/15 text-error";
};

const byLastRun = (first: Project, second: Project) =>
  (second.last_run_at ?? "").localeCompare(first.last_run_at ?? "");

export const ProjectHealthList = ({ projects }: { projects: Project[] }) => {
  const shown = projects.toSorted(byLastRun).slice(0, PROJECT_LIMIT);

  return (
    <CollapsibleCard
      icon={
        <HeartIcon
          className="size-4 shrink-0 text-secondary"
          aria-hidden="true"
        />
      }
      title="Project health"
      storageKey="dashboard-project-health"
    >
      <ul>
        {shown.map((project) => {
          const rates = project.recent_pass_rates ?? [];
          const latest = rates.at(-1);

          return (
            <li
              key={project.id}
              className="border-b border-border/60 last:border-b-0"
            >
              <Link
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-base-content/5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-base-content">
                    {project.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-fg-subtle">
                    {project.last_run_at ? (
                      <>
                        Last run <RelativeTime value={project.last_run_at} />
                      </>
                    ) : (
                      "No runs yet"
                    )}
                  </span>
                </span>
                {rates.length > 1 && <PassRateTrend rates={rates} />}
                <span
                  className={cn(
                    "w-14 shrink-0 rounded-md px-2 py-0.5 text-center text-sm font-semibold tabular-nums",
                    latest === undefined
                      ? "subtle-surface text-fg-subtle"
                      : passRateBadgeClass(latest),
                  )}
                >
                  {latest === undefined ? "—" : `${Math.round(latest)}%`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </CollapsibleCard>
  );
};
