using FluentAssertions;

using TestCraft.Application.Features.Projects;
using TestCraft.Application.UnitTests.Common.Fakes;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.UnitTests.Projects;

public class GetProjectsHandlerTests
{
    [Fact]
    public async Task Handle_SearchIsCaseInsensitiveSubstring_ReturnsMatchingProjects()
    {
        await using var context = TestDbContextFactory.Create();
        var ownerId = UserId.New();
        context.Projects.Add(Project.Create("Checkout Flow", null, ownerId));
        context.Projects.Add(Project.Create("Login Flow", null, ownerId));
        context.Projects.Add(Project.Create("Billing", null, ownerId));
        await context.SaveChangesAsync();

        var handler = new GetProjects.Handler(context, new FakeCurrentUser { UserId = ownerId });

        var result = await handler.Handle(
            new GetProjects.Query { Search = "flow" },
            CancellationToken.None
        );

        result.Items.Should().HaveCount(2);
        result.Items.Select(item => item.Name).Should().BeEquivalentTo("Checkout Flow", "Login Flow");
    }

    [Fact]
    public async Task Handle_SearchWithNoMatches_ReturnsEmpty()
    {
        await using var context = TestDbContextFactory.Create();
        var ownerId = UserId.New();
        context.Projects.Add(Project.Create("Checkout Flow", null, ownerId));
        await context.SaveChangesAsync();

        var handler = new GetProjects.Handler(context, new FakeCurrentUser { UserId = ownerId });

        var result = await handler.Handle(
            new GetProjects.Query { Search = "nonexistent" },
            CancellationToken.None
        );

        result.Items.Should().BeEmpty();
    }
}
