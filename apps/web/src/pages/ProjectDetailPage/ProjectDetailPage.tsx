import {
  ChartBarIcon,
  Cog6ToothIcon,
  PlayCircleIcon,
  RectangleStackIcon,
  TagIcon,
} from '@heroicons/react/24/solid';
import { Link, Outlet } from '@tanstack/react-router';
import { useState } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useProject } from '@/hooks/useProjects';
import { useRequiredParam } from '@/hooks/useRequiredParam';
import { ProjectSettingsModal } from '@/pages/ProjectDetailPage/ProjectSettingsModal';

const NAV_BASE =
  'flex items-center gap-1.5 border-b-2 border-transparent pb-3 pt-0.5 text-sm font-medium whitespace-nowrap text-base-content/75 transition-colors hover:text-base-content/90';
const NAV_ACTIVE = '!border-primary !text-base-content';

export const ProjectDetailPage = () => {
  const projectId = useRequiredParam('projectId');
  const { data: project, isPending } = useProject(projectId);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          <button
            className="btn btn-square shrink-0 btn-ghost btn-sm"
            onClick={() => setSettingsOpen(true)}
            aria-label="Project settings"
          >
            <Cog6ToothIcon className="size-4" />
          </button>
        </div>
      </header>

      <div
        className="flex items-end gap-5 overflow-x-auto px-4 pt-3 sm:px-6 lg:px-8"
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
          <PlayCircleIcon className="size-3.5 shrink-0" aria-hidden="true" />
          Test Runs
          {!!project?.runCount && (
            <span className="rounded-full bg-base-content/8 px-1.5 py-0.5 text-[10px] font-semibold text-base-content/85 tabular-nums">
              {project.runCount}
            </span>
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
            <span className="rounded-full bg-base-content/8 px-1.5 py-0.5 text-[10px] font-semibold text-base-content/85 tabular-nums">
              {project.suiteCount}
            </span>
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
          <ChartBarIcon className="size-3.5 shrink-0" aria-hidden="true" />
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

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </section>

      <ProjectSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectId={projectId}
        isOwner={project?.isOwner ?? false}
      />
    </div>
  );
};
