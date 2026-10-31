using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class ShareToken
{
    public ShareTokenId Id { get; private set; }
    public TestRunId TestRunId { get; private set; }
    public string TokenHash { get; private set; } = null!;
    public DateTimeOffset? ExpiresAt { get; private set; }

    public UserId CreatedById { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public TestRun? TestRun { get; }

    public static ShareToken Create(
        TestRunId testRunId,
        string tokenHash,
        DateTimeOffset? expiresAt,
        UserId createdById,
        DateTimeOffset now
    ) =>
        new()
        {
            Id = ShareTokenId.New(),
            TestRunId = testRunId,
            TokenHash = Guard.AgainstEmpty(tokenHash, nameof(TokenHash)),
            ExpiresAt = expiresAt,
            CreatedById = createdById,
            CreatedAt = now,
        };
}
