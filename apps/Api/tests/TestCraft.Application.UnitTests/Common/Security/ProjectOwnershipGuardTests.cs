using FluentAssertions;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Security;
using TestCraft.Application.UnitTests.Common.Fakes;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.UnitTests.Common.Security;

public class ProjectOwnershipGuardTests
{
    [Fact]
    public async Task EnsureOwnerAsync_UserOwnsProject_DoesNotThrow()
    {
        await using var context = TestDbContextFactory.Create();
        var ownerId = UserId.New();
        var project = new Project
        {
            Id = ProjectId.New(),
            Name = "Owned Project",
            UserId = ownerId,
        };
        context.Projects.Add(project);
        await context.SaveChangesAsync();

        var act = () =>
            ProjectOwnershipGuard.EnsureOwnerAsync(
                context,
                project.Id,
                ownerId,
                CancellationToken.None
            );

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task EnsureOwnerAsync_UserDoesNotOwnProject_ThrowsNotFoundException()
    {
        await using var context = TestDbContextFactory.Create();
        var project = new Project
        {
            Id = ProjectId.New(),
            Name = "Someone Else's Project",
            UserId = UserId.New(),
        };
        context.Projects.Add(project);
        await context.SaveChangesAsync();

        var act = () =>
            ProjectOwnershipGuard.EnsureOwnerAsync(
                context,
                project.Id,
                UserId.New(),
                CancellationToken.None
            );

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task EnsureOwnerAsync_ProjectDoesNotExist_ThrowsNotFoundException()
    {
        await using var context = TestDbContextFactory.Create();

        var act = () =>
            ProjectOwnershipGuard.EnsureOwnerAsync(
                context,
                ProjectId.New(),
                UserId.New(),
                CancellationToken.None
            );

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
