using TestCraft.Domain.Common;
using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class ProjectMember
{
    public ProjectMemberId Id { get; private set; }
    public ProjectId ProjectId { get; private set; }
    public UserId UserId { get; private set; }
    public string Email { get; private set; } = null!;
    public string? DisplayName { get; private set; }
    public AssignableRole Role { get; private set; } = AssignableRole.Editor;
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; }

    public static ProjectMember Create(
        ProjectId projectId,
        UserId userId,
        string email,
        string? displayName,
        AssignableRole role = AssignableRole.Editor
    ) =>
        new()
        {
            Id = ProjectMemberId.New(),
            ProjectId = projectId,
            UserId = userId,
            Email = Guard.AgainstEmpty(email, nameof(Email)),
            DisplayName = displayName,
            Role = role,
        };

    public void ChangeRole(AssignableRole role) => Role = role;
}
