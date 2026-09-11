using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using TestCraft.Application.Features.TestRuns;
using TestCraft.Application.UnitTests.Common.Fakes;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Persistence;

namespace TestCraft.Application.UnitTests.TestRuns;

public class StaleTestRunCleanupJobTests
{
    private static async Task<(AppDbContext Context, Project Project)> SeedProjectAsync()
    {
        var context = TestDbContextFactory.Create();
        var project = new Project
        {
            Id = ProjectId.New(),
            Name = "Project",
            UserId = UserId.New(),
        };

        context.Projects.Add(project);
        await context.SaveChangesAsync();

        return (context, project);
    }

    private static async Task<TestRun> SeedRunAsync(
        AppDbContext context,
        ProjectId projectId,
        DateTimeOffset createdAt
    )
    {
        var run = new TestRun
        {
            Id = TestRunId.New(),
            Name = "CI Run",
            Environment = "ci",
            ProjectId = projectId,
        };

        context.TestRuns.Add(run);
        await context.SaveChangesAsync();

        run.CreatedAt = createdAt;
        await context.SaveChangesAsync();

        return run;
    }

    [Fact]
    public async Task RunAsync_ActiveRunOlderThanThreshold_CompletesRun()
    {
        var (context, project) = await SeedProjectAsync();
        var staleRun = await SeedRunAsync(context, project.Id, DateTimeOffset.UtcNow.AddHours(-3));

        var job = new StaleTestRunCleanupJob(context, NullLogger<StaleTestRunCleanupJob>.Instance);
        await job.RunAsync(CancellationToken.None);

        var reloaded = await context.TestRuns.FindAsync(staleRun.Id);
        reloaded!.Status.Should().Be(TestRunStatus.Completed);
    }

    [Fact]
    public async Task RunAsync_ActiveRunWithinThreshold_LeavesRunActive()
    {
        var (context, project) = await SeedProjectAsync();
        var recentRun = await SeedRunAsync(
            context,
            project.Id,
            DateTimeOffset.UtcNow.AddMinutes(-30)
        );

        var job = new StaleTestRunCleanupJob(context, NullLogger<StaleTestRunCleanupJob>.Instance);
        await job.RunAsync(CancellationToken.None);

        var reloaded = await context.TestRuns.FindAsync(recentRun.Id);
        reloaded!.Status.Should().Be(TestRunStatus.Active);
    }

    [Fact]
    public async Task RunAsync_CompletedRunOlderThanThreshold_IsUnaffected()
    {
        var (context, project) = await SeedProjectAsync();
        var completedRun = await SeedRunAsync(
            context,
            project.Id,
            DateTimeOffset.UtcNow.AddHours(-3)
        );
        completedRun.TransitionTo(TestRunStatus.Completed);
        await context.SaveChangesAsync();

        var job = new StaleTestRunCleanupJob(context, NullLogger<StaleTestRunCleanupJob>.Instance);
        await job.RunAsync(CancellationToken.None);

        var reloaded = await context.TestRuns.FindAsync(completedRun.Id);
        reloaded!.Status.Should().Be(TestRunStatus.Completed);
    }
}