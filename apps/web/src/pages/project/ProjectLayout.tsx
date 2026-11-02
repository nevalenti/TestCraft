import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  RectangleStackIcon,
  TagIcon,
} from "@heroicons/react/24/solid";
import { getRouteApi, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SECTION_TAB, SECTION_TAB_ACTIVE } from "@/components/ui/subNavStyles";
import { useProject } from "@/features/projects/hooks";
import { useProjectPermissions } from "@/features/projects/permissions";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

const routeApi = getRouteApi("/_app/projects/$projectId");

const TabCountBadge = ({ count }: { count: number }) => (
  <span className="rounded-full bg-base-content/10 px-1.5 py-0.5 text-xs font-semibold text-fg-muted tabular-nums group-aria-[current=page]:bg-primary/15 group-aria-[current=page]:text-base-content">
    {count}
  </span>
);

export const ProjectLayout = () => {
  const { projectId } = routeApi.useParams();
  const { data: project, isPending } = useProject(projectId);
  const { canManage } = useProjectPermissions(projectId);
  const pathname = useLocation({ select: (location) => location.pathname });
  const tabListRef = useRef<HTMLElement>(null);

  useEffect(() => {
    tabListRef.current
      ?.querySelector('[data-status="active"]')
      ?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [pathname]);

  useBreadcrumbs([
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…" },
  ]);

  if (!isPending && !project)
    return (
      <ErrorState
        title="Project not found"
        message="This project may have been deleted or does not exist."
        onRetry={() => history.back()}
      />
    );

  return (
    <div className="flex min-h-0 w-full flex-col">
      <PageHeader
        title={project?.name ?? "…"}
        description={project?.description}
        backTo={{ to: "/projects" }}
        backLabel="Projects"
        nav={
          <nav
            ref={tabListRef}
            className="-mx-2 flex items-center overflow-x-auto max-lg:[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] max-sm:-mx-4 max-sm:[mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-2rem),transparent)] max-sm:px-2"
            aria-label="Project sections"
          >
            <Link
              to="/projects/$projectId/runs"
              params={{ projectId }}
              className={SECTION_TAB}
              activeProps={{ className: SECTION_TAB_ACTIVE }}
            >
              <PlayCircleIcon className="size-4 shrink-0" aria-hidden="true" />
              Test Runs
              {!!project?.run_count && (
                <TabCountBadge count={project.run_count} />
              )}
            </Link>
            <Link
              to="/projects/$projectId/suites"
              params={{ projectId }}
              className={SECTION_TAB}
              activeProps={{ className: SECTION_TAB_ACTIVE }}
            >
              <RectangleStackIcon
                className="size-4 shrink-0"
                aria-hidden="true"
              />
              Test Suites
              {!!project?.suite_count && (
                <TabCountBadge count={project.suite_count} />
              )}
            </Link>
            <Link
              to="/projects/$projectId/plans"
              params={{ projectId }}
              className={SECTION_TAB}
              activeProps={{ className: SECTION_TAB_ACTIVE }}
            >
              <ClipboardDocumentCheckIcon
                className="size-4 shrink-0"
                aria-hidden="true"
              />
              Test Plans
            </Link>
            <Link
              to="/projects/$projectId/analytics"
              params={{ projectId }}
              className={SECTION_TAB}
              activeOptions={{ exact: false }}
              activeProps={{ className: SECTION_TAB_ACTIVE }}
            >
              <ChartBarIcon className="size-4 shrink-0" aria-hidden="true" />
              Analytics
            </Link>
            <Link
              to="/projects/$projectId/labels"
              params={{ projectId }}
              className={SECTION_TAB}
              activeProps={{ className: SECTION_TAB_ACTIVE }}
            >
              <TagIcon className="size-4 shrink-0" aria-hidden="true" />
              Labels
            </Link>
            <Link
              to="/projects/$projectId/notes"
              params={{ projectId }}
              className={SECTION_TAB}
              activeProps={{ className: SECTION_TAB_ACTIVE }}
            >
              <DocumentTextIcon
                className="size-4 shrink-0"
                aria-hidden="true"
              />
              Notes
            </Link>
            {canManage && (
              <Link
                to="/projects/$projectId/settings"
                params={{ projectId }}
                className={`${SECTION_TAB} ml-auto`}
                activeOptions={{ exact: false }}
                activeProps={{ className: SECTION_TAB_ACTIVE }}
              >
                <Cog6ToothIcon className="size-4 shrink-0" aria-hidden="true" />
                Settings
              </Link>
            )}
          </nav>
        }
      />
      <section className="page-content flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex-1 has-[>[data-fill-height]]:flex has-[>[data-fill-height]]:flex-col">
          <Outlet />
        </div>
      </section>
    </div>
  );
};
