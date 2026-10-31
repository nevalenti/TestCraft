using FluentAssertions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class ShareTokenTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Create_WithEmptyToken_ThrowsDomainException()
    {
        var act = () => ShareToken.Create(TestRunId.New(), "", null, UserId.New(), Now);

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Create_SetsFields()
    {
        var runId = TestRunId.New();
        var createdById = UserId.New();
        var expiresAt = DateTimeOffset.UtcNow.AddDays(7);

        var shareToken = ShareToken.Create(runId, "token-value", expiresAt, createdById, Now);

        shareToken.TestRunId.Should().Be(runId);
        shareToken.TokenHash.Should().Be("token-value");
        shareToken.ExpiresAt.Should().Be(expiresAt);
        shareToken.CreatedById.Should().Be(createdById);
    }
}
