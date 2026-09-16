using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class ApiTokenTests
{
    [Fact]
    public void Create_WithEmptyName_ThrowsDomainException()
    {
        var act = () => ApiToken.Create("", "hash", ProjectId.New(), UserId.New(), null);

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

        var token = ApiToken.Create("CI token", "hash", projectId, createdById, expiresAt);

        token.Name.Should().Be("CI token");
        token.TokenHash.Should().Be("hash");
        token.ProjectId.Should().Be(projectId);
        token.CreatedById.Should().Be(createdById);
        token.ExpiresAt.Should().Be(expiresAt);
        token.IsRevoked.Should().BeFalse();
    }

    [Fact]
    public void Revoke_SetsIsRevoked()
    {
        var token = ApiToken.Create("CI token", "hash", ProjectId.New(), UserId.New(), null);

        token.Revoke();

        token.IsRevoked.Should().BeTrue();
    }

    [Fact]
    public void RecordUsage_SetsLastUsedAt()
    {
        var token = ApiToken.Create("CI token", "hash", ProjectId.New(), UserId.New(), null);

        token.RecordUsage();

        token.LastUsedAt.Should().NotBeNull();
    }
}
