using FluentAssertions;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Features.TestResults;
using TestCraft.Application.UnitTests.Common.Fakes;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;
using TestCraft.Infrastructure.Persistence;

namespace TestCraft.Application.UnitTests.TestResults;

public class CreateTestResultHandlerTests
{
    private static async Task<(
        AppDbContext Context,
        TestRun Run,
        TestCraft.Domain.Entities.TestCase Case
    )> SeedAsync(TestRunStatus status = TestRunStatus.Active)
    {
        var context = TestDbContextFactory.Create();

        var project = new Project { Id = ProjectId.New(), Name = "Project", UserId = UserId.New() };
        context.Projects.Add(project);

        var suite = new TestSuite
        {
            Id = TestSuiteId.New(),
            Name = "Suite",
            ProjectId = project.Id,
        };
        context.TestSuites.Add(suite);

        var testCase = new TestCraft.Domain.Entities.TestCase
        {
            Id = TestCaseId.New(),
            Name = "Case",
            SuiteId = suite.Id,
        };
        var run = new TestRun
        {
            Id = TestRunId.New(),
            Name = "Run",
            Environment = "ci",
            ProjectId = project.Id,
        };

        context.TestCases.Add(testCase);
        context.TestRuns.Add(run);
        await context.SaveChangesAsync();

        if (status != TestRunStatus.Active)
        {
            run.TransitionTo(status);
            await context.SaveChangesAsync();
        }

        return (context, run, testCase);
    }

    private static CreateTestResult.Command MakeCommand(TestRun run, TestCaseId caseId) =>
        new()
        {
            ProjectId = run.ProjectId,
            RunId = run.Id,
            TestCaseId = caseId,
            Status = TestResultStatus.Passed,
            ExecutedAt = DateTimeOffset.UtcNow,
        };

    [Fact]
    public async Task Handle_ActiveRun_AddsResultAndReturnsResponse()
    {
        var (context, run, testCase) = await SeedAsync();
        var handler = new CreateTestResult.Handler(
            context,
            new NoopCacheService(),
            new FakeCurrentUser(),
            new NoopTestRunNotifier()
        );

        var response = await handler.Handle(MakeCommand(run, testCase.Id), CancellationToken.None);

        response.TestRunId.Should().Be(run.Id);
        response.TestCaseId.Should().Be(testCase.Id);
        response.Status.Should().Be(TestResultStatus.Passed);
        context.TestResults.Should().ContainSingle(result => result.Id == response.Id);
    }

    [Fact]
    public async Task Handle_ArchivedRun_ThrowsDomainException()
    {
        var (context, run, testCase) = await SeedAsync(TestRunStatus.Archived);
        var handler = new CreateTestResult.Handler(
            context,
            new NoopCacheService(),
            new FakeCurrentUser(),
            new NoopTestRunNotifier()
        );

        var act = () => handler.Handle(MakeCommand(run, testCase.Id), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>();
    }

    [Fact]
    public async Task Handle_CompletedRun_StillAcceptsResult()
    {
        var (context, run, testCase) = await SeedAsync(TestRunStatus.Completed);
        var handler = new CreateTestResult.Handler(
            context,
            new NoopCacheService(),
            new FakeCurrentUser(),
            new NoopTestRunNotifier()
        );

        var act = () => handler.Handle(MakeCommand(run, testCase.Id), CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Handle_RunNotFound_ThrowsNotFoundException()
    {
        var context = TestDbContextFactory.Create();
        var handler = new CreateTestResult.Handler(
            context,
            new NoopCacheService(),
            new FakeCurrentUser(),
            new NoopTestRunNotifier()
        );

        var command = new CreateTestResult.Command
        {
            ProjectId = ProjectId.New(),
            RunId = TestRunId.New(),
            TestCaseId = TestCaseId.New(),
            Status = TestResultStatus.Passed,
            ExecutedAt = DateTimeOffset.UtcNow,
        };

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_RunBelongsToDifferentProject_ThrowsNotFoundException()
    {
        var (context, run, testCase) = await SeedAsync();

        var handler = new CreateTestResult.Handler(
            context,
            new NoopCacheService(),
            new FakeCurrentUser(),
            new NoopTestRunNotifier()
        );

        var command = MakeCommand(run, testCase.Id) with { ProjectId = ProjectId.New() };

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
