namespace TestCraft.Domain.Entities;

public class ApiToken
{
    public ApiTokenId Id { get; set; }
    public required string Name { get; set; }
    public required string TokenHash { get; set; }
    public ProjectId ProjectId { get; set; }

    public UserId CreatedById { get; set; }
    public DateTimeOffset? LastUsedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; set; }
}
