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
      <div className="flex min-h-0 w-full flex-col">
        <div className="page-header flex items-center justify-between gap-4">
          <div>
            <div className="mb-0.5 font-display text-2xl font-bold tracking-tight">
              <span className="inline-block h-[0.75em] w-52 skeleton rounded align-middle" />
            </div>
            <p className="mt-0.5 text-sm">
              <span className="inline-block h-[0.7em] w-80 skeleton rounded" />
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
          <div className="w-28 skeleton rounded-full px-3 py-1.5 text-sm font-medium" />
          <div className="w-24 skeleton rounded-full px-3 py-1.5 text-sm font-medium" />
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
          <p className="mb-2 font-semibold text-error">Project not found</p>
          <p className="mb-4 text-sm text-base-content/60">
            This project may have been deleted or does not exist.
          </p>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {project.name}
        </h1>
        <p className="mt-0.5 text-sm text-base-content/60">
          {project.description ??
            "Manage test suites and runs for this project"}
        </p>
      </header>

      <div className="flex shrink-0 gap-1.5 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/projects/$projectId/suites"
          params={{ projectId }}
          className={tabInactive}
          activeProps={{ className: tabActive }}
        >
          Test Suites
          {!!project.suiteCount && (
            <span className="badge rounded-full badge-ghost badge-sm">
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
            <span className="badge rounded-full badge-ghost badge-sm">
              {project.runCount}
            </span>
          )}
        </Link>
      </div>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </section>
    </div>
  );
};
