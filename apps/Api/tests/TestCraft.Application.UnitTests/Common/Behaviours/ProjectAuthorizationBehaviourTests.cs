using FluentAssertions;

using MediatR;

using TestCraft.Application.Common.Behaviours;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Security;
using TestCraft.Application.UnitTests.Common.Fakes;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.UnitTests.Common.Behaviours;

public class ProjectAuthorizationBehaviourTests
{
    private sealed record TestRequest(ProjectId ProjectId)
        : IRequest<string>,
            IProjectScopedRequest;

    [Fact]
    public async Task Handle_UserOwnsProject_InvokesNext()
    {
        await using var context = TestDbContextFactory.Create();
        var ownerId = UserId.New();
        var project = new Project
        {
            Id = ProjectId.New(),
            Name = "Project",
            UserId = ownerId,
        };
        context.Projects.Add(project);
        await context.SaveChangesAsync();

        var behaviour = new ProjectAuthorizationBehaviour<TestRequest, string>(
            context,
            new FakeCurrentUser { UserId = ownerId }
        );

        var result = await behaviour.Handle(
            new TestRequest(project.Id),
            PipelineTestHelpers.NextReturning("next-called"),
            CancellationToken.None
        );

        result.Should().Be("next-called");
    }

    [Fact]
    public async Task Handle_UserIsProjectMember_InvokesNext()
    {
        await using var context = TestDbContextFactory.Create();
        var ownerId = UserId.New();
        var memberId = UserId.New();
        var project = new Project
        {
            Id = ProjectId.New(),
            Name = "Project",
            UserId = ownerId,
        };
        context.Projects.Add(project);
        context.ProjectMembers.Add(
            new ProjectMember
            {
                Id = ProjectMemberId.New(),
                ProjectId = project.Id,
                UserId = memberId,
                Email = "member@test.com",
            }
        );
        await context.SaveChangesAsync();

        var behaviour = new ProjectAuthorizationBehaviour<TestRequest, string>(
            context,
            new FakeCurrentUser { UserId = memberId }
        );

        var result = await behaviour.Handle(
            new TestRequest(project.Id),
            PipelineTestHelpers.NextReturning("next-called"),
            CancellationToken.None
        );

        result.Should().Be("next-called");
    }

    [Fact]
    public async Task Handle_UserHasNoAccessToProject_ThrowsNotFoundException()
    {
        await using var context = TestDbContextFactory.Create();
        var project = new Project
        {
            Id = ProjectId.New(),
            Name = "Project",
            UserId = UserId.New(),
        };
        context.Projects.Add(project);
        await context.SaveChangesAsync();

        var behaviour = new ProjectAuthorizationBehaviour<TestRequest, string>(
            context,
            new FakeCurrentUser()
        );

        var act = () =>
            behaviour.Handle(
                new TestRequest(project.Id),
                PipelineTestHelpers.NextReturning("next-called"),
                CancellationToken.None
            );

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ProjectDoesNotExist_ThrowsNotFoundException()
    {
        await using var context = TestDbContextFactory.Create();

        var behaviour = new ProjectAuthorizationBehaviour<TestRequest, string>(
            context,
            new FakeCurrentUser()
        );

        var act = () =>
            behaviour.Handle(
                new TestRequest(ProjectId.New()),
                PipelineTestHelpers.NextReturning("next-called"),
                CancellationToken.None
            );

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
