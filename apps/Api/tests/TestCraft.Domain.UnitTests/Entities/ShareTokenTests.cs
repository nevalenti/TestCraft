using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class ShareTokenTests
{
    [Fact]
    public void Create_WithEmptyToken_ThrowsDomainException()
    {
        var act = () => ShareToken.Create(TestRunId.New(), "", null, UserId.New());

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

        var shareToken = ShareToken.Create(runId, "token-value", expiresAt, createdById);

        shareToken.TestRunId.Should().Be(runId);
        shareToken.Token.Should().Be("token-value");
        shareToken.ExpiresAt.Should().Be(expiresAt);
        shareToken.CreatedById.Should().Be(createdById);
    }
}
