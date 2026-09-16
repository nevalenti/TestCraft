using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class ApiToken
{
    public ApiTokenId Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string TokenHash { get; private set; } = null!;
    public ProjectId ProjectId { get; private set; }

    public UserId CreatedById { get; private set; }
    public DateTimeOffset? LastUsedAt { get; private set; }
    public DateTimeOffset? ExpiresAt { get; private set; }
    public bool IsRevoked { get; private set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; set; }

    public static ApiToken Create(
        string name,
        string tokenHash,
        ProjectId projectId,
        UserId createdById,
        DateTimeOffset? expiresAt
    ) =>
        new()
        {
            Id = ApiTokenId.New(),
            Name = Guard.AgainstEmpty(name, nameof(Name)),
            TokenHash = Guard.AgainstEmpty(tokenHash, nameof(TokenHash)),
            ProjectId = projectId,
            CreatedById = createdById,
            ExpiresAt = expiresAt,
        };

    public void Revoke() => IsRevoked = true;

    public void RecordUsage() => LastUsedAt = DateTimeOffset.UtcNow;
}
