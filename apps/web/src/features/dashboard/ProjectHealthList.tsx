import { Link } from "@tanstack/react-router";
import type { Project } from "@testcraft/types";

import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { PassRateTrend } from "@/features/projects/PassRateTrend";
import { cn } from "@/lib/cn";
import { passRateClass } from "@/lib/format";

const PROJECT_LIMIT = 6;

const byLastRun = (first: Project, second: Project) =>
  (second.last_run_at ?? "").localeCompare(first.last_run_at ?? "");

export const ProjectHealthList = ({ projects }: { projects: Project[] }) => {
  const shown = projects.toSorted(byLastRun).slice(0, PROJECT_LIMIT);

  return (
    <CollapsibleCard
      title="Project health"
      description="Latest completed run per project"
      storageKey="dashboard-project-health"
      actions={
        <Link to="/projects" className="btn shrink-0 btn-ghost btn-xs">
          All projects
        </Link>
      }
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
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-content/5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-base-content">
                    {project.name}
                  </span>
                  <span className="block text-xs text-fg-subtle">
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
                    "w-12 text-right text-sm font-semibold tabular-nums",
                    latest === undefined
                      ? "text-fg-subtle"
                      : passRateClass(latest),
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
