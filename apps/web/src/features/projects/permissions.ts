import { ProjectRole } from "@testcraft/types";

import { useProject } from "@/features/projects/hooks";

const RANK: Record<ProjectRole, number> = {
  [ProjectRole.Viewer]: 0,
  [ProjectRole.Editor]: 1,
  [ProjectRole.Admin]: 2,
  [ProjectRole.Owner]: 3,
};

export const hasRole = (
  role: ProjectRole | undefined,
  minimum: ProjectRole,
): boolean => role !== undefined && RANK[role] >= RANK[minimum];

export const useProjectPermissions = (projectId: string) => {
  const { data: project } = useProject(projectId);
  const role = project?.role;

  return {
    role,
    canEdit: hasRole(role, ProjectRole.Editor),
    canManage: hasRole(role, ProjectRole.Admin),
    isOwner: role === ProjectRole.Owner,
  };
};
