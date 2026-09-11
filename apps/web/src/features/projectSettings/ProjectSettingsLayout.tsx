import { BellIcon, KeyIcon, UsersIcon } from '@heroicons/react/24/solid';
import { Link, Outlet } from '@tanstack/react-router';

import { useProject } from '@/features/projects/hooks';
import { useRequiredParam } from '@/hooks/useRequiredParam';

const TAB_BASE =
  'flex items-center gap-1.5 border-b-2 border-transparent pb-2 pt-0.5 text-sm font-medium whitespace-nowrap text-base-content/75 transition-colors hover:text-base-content/90';
const TAB_ACTIVE = '!border-primary !text-base-content';

export const ProjectSettingsLayout = () => {
  const projectId = useRequiredParam('projectId');
  const { data: project } = useProject(projectId);

  return (
    <div className="pt-1">
      <div
        className="-mb-px flex items-end gap-5 overflow-x-auto border-b border-border"
        role="tablist"
      >
        <Link
          to="/projects/$projectId/settings/tokens"
          params={{ projectId }}
          role="tab"
          className={TAB_BASE}
          activeProps={{ className: TAB_ACTIVE }}
        >
          <KeyIcon className="size-3.5 shrink-0" aria-hidden="true" />
          API Tokens
        </Link>
        <Link
          to="/projects/$projectId/settings/notifications"
          params={{ projectId }}
          role="tab"
          className={TAB_BASE}
          activeProps={{ className: TAB_ACTIVE }}
        >
          <BellIcon className="size-3.5 shrink-0" aria-hidden="true" />
          Notifications
        </Link>
        {project?.isOwner && (
          <Link
            to="/projects/$projectId/settings/members"
            params={{ projectId }}
            role="tab"
            className={TAB_BASE}
            activeProps={{ className: TAB_ACTIVE }}
          >
            <UsersIcon className="size-3.5 shrink-0" aria-hidden="true" />
            Members
          </Link>
        )}
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
};
