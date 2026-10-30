namespace TestCraft.Domain.Enums;

public static class ProjectRoles
{
    public static ProjectRole ToProjectRole(this AssignableRole role) =>
        role switch
        {
            AssignableRole.Viewer => ProjectRole.Viewer,
            AssignableRole.Editor => ProjectRole.Editor,
            AssignableRole.Admin => ProjectRole.Admin,
            _ => throw new ArgumentOutOfRangeException(nameof(role), role, null),
        };

    public static ProjectRole Resolve(bool isOwner, AssignableRole? memberRole) =>
        isOwner ? ProjectRole.Owner : memberRole?.ToProjectRole() ?? ProjectRole.Viewer;

    public static bool HasAtLeast(this ProjectRole role, ProjectRole minimum) => role >= minimum;

    public static bool CanManage(this ProjectRole actor, AssignableRole memberRole) =>
        actor == ProjectRole.Owner
        || (actor == ProjectRole.Admin && memberRole != AssignableRole.Admin);
}
