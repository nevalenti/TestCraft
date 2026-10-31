using FluentAssertions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class ApiTokenTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Create_WithEmptyName_ThrowsDomainException()
    {
        var act = () =>
            ApiToken.Create(
                "",
                "hash",
                ProjectId.New(),
                UserId.New(),
                null,
                [ApiTokenScope.RunsRead]
            );

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Create_SetsFieldsAndIsNotRevoked()
    {
        var projectId = ProjectId.New();
        var createdById = UserId.New();
        var expiresAt = DateTimeOffset.UtcNow.AddDays(30);

        var token = ApiToken.Create(
            "CI token",
            "hash",
            projectId,
            createdById,
            expiresAt,
            [ApiTokenScope.RunsRead]
        );

        token.Name.Should().Be("CI token");
        token.TokenHash.Should().Be("hash");
        token.ProjectId.Should().Be(projectId);
        token.CreatedById.Should().Be(createdById);
        token.ExpiresAt.Should().Be(expiresAt);
        token.IsRevoked.Should().BeFalse();
        token.Scopes.Should().Equal(ApiTokenScope.RunsRead);
    }

    [Fact]
    public void Revoke_SetsIsRevoked()
    {
        var token = ApiToken.Create(
            "CI token",
            "hash",
            ProjectId.New(),
            UserId.New(),
            null,
            [ApiTokenScope.RunsRead]
        );

        token.Revoke();

        token.IsRevoked.Should().BeTrue();
    }

    [Fact]
    public void RecordUsage_SetsLastUsedAt()
    {
        var token = ApiToken.Create(
            "CI token",
            "hash",
            ProjectId.New(),
            UserId.New(),
            null,
            [ApiTokenScope.RunsRead]
        );

        token.RecordUsage(Now);

        token.LastUsedAt.Should().Be(Now);
    }

    [Theory]
    [InlineData(30, 0)]
    [InlineData(60, 60)]
    public void RecordUsage_AgainSoon_KeepsTheEarlierTimeUntilAMinuteHasPassed(
        int secondsLater,
        int expectedSecondsAfterFirstUse
    )
    {
        var token = ApiToken.Create(
            "CI token",
            "hash",
            ProjectId.New(),
            UserId.New(),
            null,
            [ApiTokenScope.RunsRead]
        );
        token.RecordUsage(Now);

        token.RecordUsage(Now.AddSeconds(secondsLater));

        token.LastUsedAt.Should().Be(Now.AddSeconds(expectedSecondsAfterFirstUse));
    }

    [Theory]
    [InlineData(ApiTokenScope.SuitesRead, "suites_read")]
    [InlineData(ApiTokenScope.AnalyticsRead, "analytics_read")]
    [InlineData(ApiTokenScope.NotesWrite, "notes_write")]
    public void ScopeNames_AreSnakeCaseAndRoundTrip(ApiTokenScope scope, string name)
    {
        scope.Name().Should().Be(name);
        ApiTokenScopes.Parse(name).Should().Be(scope);
    }
}
