using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class ShareToken
{
    public ShareTokenId Id { get; private set; }
    public TestRunId TestRunId { get; private set; }
    public string Token { get; private set; } = null!;
    public DateTimeOffset? ExpiresAt { get; private set; }

    public UserId CreatedById { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public TestRun? TestRun { get; set; }

    public static ShareToken Create(
        TestRunId testRunId,
        string token,
        DateTimeOffset? expiresAt,
        UserId createdById
    ) =>
        new()
        {
            Id = ShareTokenId.New(),
            TestRunId = testRunId,
            Token = Guard.AgainstEmpty(token, nameof(Token)),
            ExpiresAt = expiresAt,
            CreatedById = createdById,
            CreatedAt = DateTimeOffset.UtcNow,
        };
}
