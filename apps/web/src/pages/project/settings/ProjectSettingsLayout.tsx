import { BellIcon, KeyIcon, UsersIcon } from "@heroicons/react/24/solid";
import { getRouteApi, Link, Outlet } from "@tanstack/react-router";

import { ErrorState } from "@/components/ui/ErrorState";
import { SubNav } from "@/components/ui/SubNav";
import { SUB_NAV_ACTIVE, SUB_NAV_ITEM } from "@/components/ui/subNavStyles";
import { useProject } from "@/features/projects/hooks";
import { useProjectPermissions } from "@/features/projects/permissions";

const routeApi = getRouteApi("/_app/projects/$projectId/settings");

export const ProjectSettingsLayout = () => {
  const { projectId } = routeApi.useParams();
  const { data: project } = useProject(projectId);
  const { canManage } = useProjectPermissions(projectId);

  if (project && !canManage)
    return (
      <ErrorState
        title="Admins only"
        message="Only project admins and the owner can change project settings."
      />
    );

  return (
    <div className="pt-1">
      <SubNav label="Project settings">
        <Link
          to="/projects/$projectId/settings/tokens"
          params={{ projectId }}
          className={SUB_NAV_ITEM}
          activeProps={{ className: SUB_NAV_ACTIVE }}
        >
          <KeyIcon className="size-3.5 shrink-0" aria-hidden="true" />
          API Tokens
        </Link>
        <Link
          to="/projects/$projectId/settings/notifications"
          params={{ projectId }}
          className={SUB_NAV_ITEM}
          activeProps={{ className: SUB_NAV_ACTIVE }}
        >
          <BellIcon className="size-3.5 shrink-0" aria-hidden="true" />
          Notifications
        </Link>
        <Link
          to="/projects/$projectId/settings/members"
          params={{ projectId }}
          className={SUB_NAV_ITEM}
          activeProps={{ className: SUB_NAV_ACTIVE }}
        >
          <UsersIcon className="size-3.5 shrink-0" aria-hidden="true" />
          Members
        </Link>
      </SubNav>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
};
