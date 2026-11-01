import { AssignableRole, ProjectRole } from "@testcraft/types";

export const canManageMember = (
  actor: ProjectRole | undefined,
  memberRole: AssignableRole,
): boolean =>
  actor === ProjectRole.Owner ||
  (actor === ProjectRole.Admin && memberRole !== AssignableRole.Admin);

export const MEMBER_ROLE_LABELS: Record<AssignableRole, string> = {
  [AssignableRole.Viewer]: "Viewer",
  [AssignableRole.Editor]: "Editor",
  [AssignableRole.Admin]: "Admin",
};

export const assignableRoles = (
  actor: ProjectRole | undefined,
): AssignableRole[] =>
  Object.values(AssignableRole).filter((role) => canManageMember(actor, role));
