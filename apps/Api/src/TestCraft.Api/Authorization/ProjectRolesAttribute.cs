using TestCraft.Domain.Enums;

namespace TestCraft.Api.Authorization;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class ProjectRolesAttribute : Attribute
{
    public ProjectRole Read { get; init; } = ProjectRole.Viewer;

    public ProjectRole Write { get; init; } = ProjectRole.Editor;
}
