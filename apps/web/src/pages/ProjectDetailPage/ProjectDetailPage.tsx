import {
  ChartBarIcon,
  Cog6ToothIcon,
  PlayCircleIcon,
  RectangleStackIcon,
  TagIcon,
} from "@heroicons/react/24/solid";
import { Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";

import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import { ProjectSettingsModal } from "@/pages/ProjectDetailPage/ProjectSettingsModal";

export const ProjectDetailPage = () => {
  const projectId = useRequiredParam("projectId");
  const { data: project, isPending } = useProject(projectId);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useBreadcrumbs([
    { label: "Dashboard", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…" },
  ]);

  if (!isPending && !project)
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
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {project?.name}
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            {project?.description ??
              "Manage test suites and runs for this project"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div role="tablist" className="tabs-box tabs tabs-sm">
            <Link
              to="/projects/$projectId/runs"
              params={{ projectId }}
              role="tab"
              className="tab gap-2 leading-none font-semibold"
              activeProps={{
                className:
                  "tab tab-active gap-2 font-semibold leading-none [--tab-bg:var(--color-neutral)] text-neutral-content",
              }}
            >
              <PlayCircleIcon className="size-4" />
              Test Runs
              {!!project?.runCount && (
                <span className="badge min-w-5 rounded-full badge-ghost px-1! badge-sm">
                  {project.runCount}
                </span>
              )}
            </Link>
            <Link
              to="/projects/$projectId/suites"
              params={{ projectId }}
              role="tab"
              className="tab gap-2 leading-none font-semibold"
              activeProps={{
                className:
                  "tab tab-active gap-2 font-semibold leading-none [--tab-bg:var(--color-neutral)] text-neutral-content",
              }}
            >
              <RectangleStackIcon className="size-4" />
              Test Suites
              {!!project?.suiteCount && (
                <span className="badge min-w-5 rounded-full badge-ghost px-1! badge-sm">
                  {project.suiteCount}
                </span>
              )}
            </Link>
            <Link
              to="/projects/$projectId/analytics/trend"
              params={{ projectId }}
              role="tab"
              className="tab gap-2 leading-none font-semibold"
              activeOptions={{ exact: false }}
              activeProps={{
                className:
                  "tab tab-active gap-2 font-semibold leading-none [--tab-bg:var(--color-neutral)] text-neutral-content",
              }}
            >
              <ChartBarIcon className="size-4" />
              Analytics
            </Link>
            <Link
              to="/projects/$projectId/labels"
              params={{ projectId }}
              role="tab"
              className="tab gap-2 leading-none font-semibold"
              activeProps={{
                className:
                  "tab tab-active gap-2 font-semibold leading-none [--tab-bg:var(--color-neutral)] text-neutral-content",
              }}
            >
              <TagIcon className="size-4" />
              Labels
            </Link>
          </div>
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={() => setSettingsOpen(true)}
            aria-label="Project settings"
          >
            <Cog6ToothIcon className="size-5" />
          </button>
        </div>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </section>

      <ProjectSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectId={projectId}
      />
    </div>
  );
};
