using FluentAssertions;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.UnitTests.Common;

public class ProjectOwnershipGuardTests
{
    [Fact]
    public async Task EnsureOwnerAsync_UserOwnsProject_DoesNotThrow()
    {
        await using var context = TestDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var project = new Project { Name = "Owned Project", UserId = ownerId };
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
        var project = new Project { Name = "Someone Else's Project", UserId = Guid.NewGuid() };
        context.Projects.Add(project);
        await context.SaveChangesAsync();

        var act = () =>
            ProjectOwnershipGuard.EnsureOwnerAsync(
                context,
                project.Id,
                Guid.NewGuid(),
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
                Guid.NewGuid(),
                Guid.NewGuid(),
                CancellationToken.None
            );

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
