namespace TestCraft.Application.ApiTokens;

public record ApiTokenResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required Guid ProjectId { get; init; }
    public DateTimeOffset? LastUsedAt { get; init; }
    public DateTimeOffset? ExpiresAt { get; init; }
    public required bool IsRevoked { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
}

public record CreateApiTokenResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Token { get; init; }
}
