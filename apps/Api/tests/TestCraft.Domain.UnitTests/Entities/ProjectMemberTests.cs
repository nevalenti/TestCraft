using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class ProjectMemberTests
{
    [Fact]
    public void Create_WithEmptyEmail_ThrowsDomainException()
    {
        var act = () => ProjectMember.Create(ProjectId.New(), UserId.New(), "", "Name");

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Create_SetsFields()
    {
        var projectId = ProjectId.New();
        var userId = UserId.New();

        var member = ProjectMember.Create(projectId, userId, "member@test.com", "Member Name");

        member.ProjectId.Should().Be(projectId);
        member.UserId.Should().Be(userId);
        member.Email.Should().Be("member@test.com");
        member.DisplayName.Should().Be("Member Name");
    }
}
