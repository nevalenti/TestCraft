import {
  ArrowLeftIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlayCircleIcon,
  RectangleStackIcon,
  TagIcon,
} from '@heroicons/react/24/solid';
import { Link, Outlet, useLocation } from '@tanstack/react-router';

import { ErrorState } from '@/components/ErrorState';
import { useProject } from '@/features/projects/hooks';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useRequiredParam } from '@/hooks/useRequiredParam';

const NAV_BASE =
  'flex items-center gap-1.5 border-b-2 border-transparent pb-2 pt-0.5 text-sm font-medium whitespace-nowrap text-base-content/75 transition-colors hover:text-base-content/90';
const NAV_ACTIVE = '!border-primary !text-base-content';

const TabCountBadge = ({ count }: { count: number }) => (
  <span className="rounded-full bg-base-content/8 px-1.5 py-0.5 text-xs font-semibold text-base-content/70 tabular-nums">
    {count}
  </span>
);

export const ProjectDetailPage = () => {
  const projectId = useRequiredParam('projectId');
  const { data: project, isPending } = useProject(projectId);
  const { pathname } = useLocation();
  const isSettingsSection = pathname.includes(
    `/projects/${projectId}/settings`,
  );

  useBreadcrumbs([
    { label: 'Projects', href: '/projects' },
    { label: project?.name ?? '…' },
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
      <header className="page-header">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="page-title">{project?.name}</h1>
            <p className="mt-0.5 text-sm text-base-content/70">
              {project?.description ??
                'Manage test suites and runs for this project'}
            </p>
          </div>
          {isSettingsSection ? (
            <Link
              to="/projects/$projectId"
              params={{ projectId }}
              className="btn btn-square shrink-0 border-none bg-base-200 text-base-content btn-sm hover:bg-base-300"
              aria-label="Back to project"
            >
              <ArrowLeftIcon className="size-4" />
            </Link>
          ) : (
            <Link
              to="/projects/$projectId/settings"
              params={{ projectId }}
              className="btn btn-square shrink-0 border-none bg-base-200 text-base-content btn-sm hover:bg-base-300"
              aria-label="Project settings"
            >
              <Cog6ToothIcon className="size-4" />
            </Link>
          )}
        </div>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        {isSettingsSection ? (
          <Outlet />
        ) : (
          <div className="pt-1">
            <div
              className="-mb-px flex items-end gap-5 overflow-x-auto border-b border-border"
              role="tablist"
              aria-label="Project sections"
            >
              <Link
                to="/projects/$projectId/runs"
                params={{ projectId }}
                role="tab"
                className={NAV_BASE}
                activeProps={{ className: NAV_ACTIVE }}
              >
                <PlayCircleIcon
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                Test Runs
                {!!project?.runCount && (
                  <TabCountBadge count={project.runCount} />
                )}
              </Link>
              <Link
                to="/projects/$projectId/suites"
                params={{ projectId }}
                role="tab"
                className={NAV_BASE}
                activeProps={{ className: NAV_ACTIVE }}
              >
                <RectangleStackIcon
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                Test Suites
                {!!project?.suiteCount && (
                  <TabCountBadge count={project.suiteCount} />
                )}
              </Link>
              <Link
                to="/projects/$projectId/analytics"
                params={{ projectId }}
                role="tab"
                className={NAV_BASE}
                activeOptions={{ exact: false }}
                activeProps={{ className: NAV_ACTIVE }}
              >
                <ChartBarIcon
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                Analytics
              </Link>
              <Link
                to="/projects/$projectId/labels"
                params={{ projectId }}
                role="tab"
                className={NAV_BASE}
                activeProps={{ className: NAV_ACTIVE }}
              >
                <TagIcon className="size-3.5 shrink-0" aria-hidden="true" />
                Labels
              </Link>
            </div>
            <div className="pt-6">
              <Outlet />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
