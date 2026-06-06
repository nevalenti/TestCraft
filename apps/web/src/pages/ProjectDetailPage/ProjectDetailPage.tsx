import { Link, Outlet } from "@tanstack/react-router";

import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";

const tabBase =
  "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors border";
const tabActive = `${tabBase} bg-primary/15 text-primary font-semibold border-primary/25`;
const tabInactive = `${tabBase} text-base-content border-base-content/12 hover:text-base-content hover:bg-base-content/8 cursor-pointer`;

export const ProjectDetailPage = () => {
  const projectId = useRequiredParam("projectId");
  const { data: project, isPending } = useProject(projectId);

  useBreadcrumbs([
    { label: "Dashboard", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…" },
  ]);

  if (isPending)
    return (
      <div className="w-full flex flex-col min-h-0">
        <div className="page-header flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold tracking-tight font-display mb-0.5">
              <span className="skeleton inline-block w-52 h-[0.75em] rounded align-middle" />
            </div>
            <p className="mt-0.5 text-sm">
              <span className="skeleton inline-block w-80 h-[0.7em] rounded" />
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 px-4 sm:px-6 lg:px-8 py-3 border-b border-border shrink-0">
          <div className="px-3 py-1.5 text-sm font-medium rounded-full skeleton w-28" />
          <div className="px-3 py-1.5 text-sm font-medium rounded-full skeleton w-24" />
        </div>
        <div className="page-content">
          <SkeletonGrid />
        </div>
      </div>
    );

  if (!project)
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-error font-semibold mb-2">Project not found</p>
          <p className="text-base-content/60 text-sm mb-4">
            This project may have been deleted or does not exist.
          </p>
        </div>
      </div>
    );

  return (
    <div className="w-full flex flex-col min-h-0">
      <header className="page-header">
        <h1 className="text-2xl font-bold tracking-tight font-display">
          {project.name}
        </h1>
        <p className="mt-0.5 text-sm text-base-content/60">
          {project.description ??
            "Manage test suites and runs for this project"}
        </p>
      </header>

      <div className="flex gap-1.5 px-4 sm:px-6 lg:px-8 py-3 border-b border-border shrink-0">
        <Link
          to="/projects/$projectId/suites"
          params={{ projectId }}
          className={tabInactive}
          activeProps={{ className: tabActive }}
        >
          Test Suites
          {!!project.suiteCount && (
            <span className="badge badge-sm badge-ghost rounded-full">
              {project.suiteCount}
            </span>
          )}
        </Link>
        <Link
          to="/projects/$projectId/runs"
          params={{ projectId }}
          className={tabInactive}
          activeProps={{ className: tabActive }}
        >
          Test Runs
          {!!project.runCount && (
            <span className="badge badge-sm badge-ghost rounded-full">
              {project.runCount}
            </span>
          )}
        </Link>
      </div>

      <section className="page-content flex-1 overflow-y-auto min-h-0">
        <Outlet />
      </section>
    </div>
  );
};
