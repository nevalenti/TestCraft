using FluentAssertions;

using TestCraft.Application.Features.TestSuites;
using TestCraft.Application.UnitTests.Common.Fakes;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.UnitTests.TestSuites;

public class GetTestSuitesHandlerTests
{
    [Fact]
    public async Task Handle_SearchIsCaseInsensitiveSubstring_ReturnsMatchingSuites()
    {
        await using var context = TestDbContextFactory.Create();
        var projectId = ProjectId.New();
        context.TestSuites.Add(TestSuite.Create(projectId, "Smoke Suite"));
        context.TestSuites.Add(TestSuite.Create(projectId, "Regression Suite"));
        context.TestSuites.Add(TestSuite.Create(projectId, "Nightly"));
        await context.SaveChangesAsync();

        var handler = new GetTestSuites.Handler(context);

        var result = await handler.Handle(
            new GetTestSuites.Query { ProjectId = projectId, Search = "suite" },
            CancellationToken.None
        );

        result.Items.Should().HaveCount(2);
        result
            .Items.Select(item => item.Name)
            .Should()
            .BeEquivalentTo("Smoke Suite", "Regression Suite");
    }

    [Fact]
    public async Task Handle_SearchWithNoMatches_ReturnsEmpty()
    {
        await using var context = TestDbContextFactory.Create();
        var projectId = ProjectId.New();
        context.TestSuites.Add(TestSuite.Create(projectId, "Smoke Suite"));
        await context.SaveChangesAsync();

        var handler = new GetTestSuites.Handler(context);

        var result = await handler.Handle(
            new GetTestSuites.Query { ProjectId = projectId, Search = "nonexistent" },
            CancellationToken.None
        );

        result.Items.Should().BeEmpty();
    }
}
