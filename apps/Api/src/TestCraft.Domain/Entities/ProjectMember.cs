using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class ProjectMember
{
    public ProjectMemberId Id { get; private set; }
    public ProjectId ProjectId { get; private set; }
    public UserId UserId { get; private set; }
    public string Email { get; private set; } = null!;
    public string? DisplayName { get; private set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; set; }

    public static ProjectMember Create(
        ProjectId projectId,
        UserId userId,
        string email,
        string? displayName
    ) =>
        new()
        {
            Id = ProjectMemberId.New(),
            ProjectId = projectId,
            UserId = userId,
            Email = Guard.AgainstEmpty(email, nameof(Email)),
            DisplayName = displayName,
        };
}
