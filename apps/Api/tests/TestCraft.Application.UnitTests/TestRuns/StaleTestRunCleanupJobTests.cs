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
    private sealed class ManualClock(DateTimeOffset now) : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = now;

        public override DateTimeOffset GetUtcNow() => Now;
    }

    private static async Task<(
        AppDbContext Context,
        Project Project,
        ManualClock Clock
    )> SeedProjectAsync(DateTimeOffset initialTime)
    {
        var clock = new ManualClock(initialTime);
        var context = TestDbContextFactory.Create(timeProvider: clock);
        var project = Project.Create("Project", null, UserId.New());

        context.Projects.Add(project);
        await context.SaveChangesAsync();

        return (context, project, clock);
    }

    private static async Task<TestRun> SeedRunAsync(AppDbContext context, ProjectId projectId)
    {
        var run = TestRun.Create(projectId, "CI Run", "ci");

        context.TestRuns.Add(run);
        await context.SaveChangesAsync();

        return run;
    }

    [Fact]
    public async Task RunAsync_ActiveRunOlderThanThreshold_CompletesRun()
    {
        var (context, project, clock) = await SeedProjectAsync(DateTimeOffset.UtcNow.AddHours(-3));
        var staleRun = await SeedRunAsync(context, project.Id);
        clock.Now = DateTimeOffset.UtcNow;

        var job = new StaleTestRunCleanupJob(
            context,
            NullLogger<StaleTestRunCleanupJob>.Instance,
            clock
        );
        await job.RunAsync(CancellationToken.None);

        var reloaded = await context.TestRuns.FindAsync(staleRun.Id);
        reloaded!.Status.Should().Be(TestRunStatus.Completed);
    }

    [Fact]
    public async Task RunAsync_ActiveRunWithinThreshold_LeavesRunActive()
    {
        var (context, project, clock) = await SeedProjectAsync(
            DateTimeOffset.UtcNow.AddMinutes(-30)
        );
        var recentRun = await SeedRunAsync(context, project.Id);
        clock.Now = DateTimeOffset.UtcNow;

        var job = new StaleTestRunCleanupJob(
            context,
            NullLogger<StaleTestRunCleanupJob>.Instance,
            clock
        );
        await job.RunAsync(CancellationToken.None);

        var reloaded = await context.TestRuns.FindAsync(recentRun.Id);
        reloaded!.Status.Should().Be(TestRunStatus.Active);
    }

    [Fact]
    public async Task RunAsync_CompletedRunOlderThanThreshold_IsUnaffected()
    {
        var (context, project, clock) = await SeedProjectAsync(DateTimeOffset.UtcNow.AddHours(-3));
        var completedRun = await SeedRunAsync(context, project.Id);
        clock.Now = DateTimeOffset.UtcNow;
        completedRun.TransitionTo(TestRunStatus.Completed);
        await context.SaveChangesAsync();

        var job = new StaleTestRunCleanupJob(
            context,
            NullLogger<StaleTestRunCleanupJob>.Instance,
            clock
        );
        await job.RunAsync(CancellationToken.None);

        var reloaded = await context.TestRuns.FindAsync(completedRun.Id);
        reloaded!.Status.Should().Be(TestRunStatus.Completed);
    }

    [Fact]
    public async Task RunAsync_RecentLog_LeavesOldRunActive()
    {
        var (context, project, clock) = await SeedProjectAsync(DateTimeOffset.UtcNow.AddHours(-3));
        var run = await SeedRunAsync(context, project.Id);
        clock.Now = DateTimeOffset.UtcNow;
        var log = RunLog.Create(run.Id, "CI is still running");
        log.CreatedAt = clock.Now;
        context.RunLogs.Add(log);
        await context.SaveChangesAsync();

        var job = new StaleTestRunCleanupJob(
            context,
            NullLogger<StaleTestRunCleanupJob>.Instance,
            clock
        );
        await job.RunAsync(CancellationToken.None);

        run.Status.Should().Be(TestRunStatus.Active);
    }

    [Fact]
    public async Task RunAsync_RecentResult_LeavesOldRunActive()
    {
        var (context, project, clock) = await SeedProjectAsync(DateTimeOffset.UtcNow.AddHours(-3));
        var run = await SeedRunAsync(context, project.Id);
        clock.Now = DateTimeOffset.UtcNow;
        context.TestResults.Add(
            TestResult.Create(
                run.Id,
                TestCaseId.New(),
                TestResultStatus.Passed,
                null,
                null,
                null,
                clock.Now,
                null
            )
        );
        await context.SaveChangesAsync();

        var job = new StaleTestRunCleanupJob(
            context,
            NullLogger<StaleTestRunCleanupJob>.Instance,
            clock
        );
        await job.RunAsync(CancellationToken.None);

        run.Status.Should().Be(TestRunStatus.Active);
    }
}
