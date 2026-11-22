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

    extension(ProjectRole role)
    {
        public bool HasAtLeast(ProjectRole minimum) => role >= minimum;

        public bool CanManage(AssignableRole memberRole) =>
            role == ProjectRole.Owner
            || (role == ProjectRole.Admin && memberRole != AssignableRole.Admin);
    }
}
