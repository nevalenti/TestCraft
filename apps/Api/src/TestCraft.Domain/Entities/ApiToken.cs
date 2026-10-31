using TestCraft.Domain.Common;
using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class ApiToken
{
    public ApiTokenId Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string TokenHash { get; private set; } = null!;
    public ProjectId ProjectId { get; private set; }
    public ApiTokenScope[] Scopes { get; private set; } = [];

    public UserId CreatedById { get; private set; }
    public DateTimeOffset? LastUsedAt { get; private set; }
    public DateTimeOffset? ExpiresAt { get; private set; }
    public bool IsRevoked { get; private set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; }

    public static ApiToken Create(
        string name,
        string tokenHash,
        ProjectId projectId,
        UserId createdById,
        DateTimeOffset? expiresAt,
        IEnumerable<ApiTokenScope> scopes
    ) =>
        new()
        {
            Id = ApiTokenId.New(),
            Name = Guard.AgainstEmpty(name, nameof(Name)),
            TokenHash = Guard.AgainstEmpty(tokenHash, nameof(TokenHash)),
            ProjectId = projectId,
            CreatedById = createdById,
            ExpiresAt = expiresAt,
            Scopes = [.. scopes],
        };

    public void Revoke() => IsRevoked = true;

    /// <summary>How stale <see cref="LastUsedAt"/> may get, so that busy tokens don't write on every request.</summary>
    public static readonly TimeSpan UsageResolution = TimeSpan.FromMinutes(1);

    public void RecordUsage(DateTimeOffset now)
    {
        if (LastUsedAt is { } lastUsedAt && now - lastUsedAt < UsageResolution)
        {
            return;
        }

        LastUsedAt = now;
    }
}
