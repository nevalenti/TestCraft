namespace TestCraft.Application.ShareTokens;

public record ShareTokenResponse(
    Guid Id,
    Guid TestRunId,
    string Token,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset CreatedAt
);
