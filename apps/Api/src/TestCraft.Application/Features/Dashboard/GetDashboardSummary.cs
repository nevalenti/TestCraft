using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Dashboard;

public sealed record FailingTestResponse
{
    public required TestCaseId TestCaseId { get; init; }
    public required string TestCaseName { get; init; }
    public required TestSuiteId SuiteId { get; init; }
    public required ProjectId ProjectId { get; init; }
    public required string ProjectName { get; init; }
    public required int FailureCount { get; init; }
    public required DateTimeOffset LastFailedAt { get; init; }
}

public sealed record DashboardSummaryResponse
{
    public required int WindowDays { get; init; }
    public required double? PassRate { get; init; }
    public required double? PreviousPassRate { get; init; }
    public required int ExecutedCount { get; init; }
    public required int FailingTestCount { get; init; }
    public required int FlakyTestCount { get; init; }
    public required int ActiveRunCount { get; init; }
    public required IReadOnlyList<FailingTestResponse> TopFailingTests { get; init; }
}

public static class GetDashboardSummary
{
    public sealed record Query : IRequest<DashboardSummaryResponse>;

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        TimeProvider timeProvider
    ) : IRequestHandler<Query, DashboardSummaryResponse>
    {
        private const int WindowDays = 7;
        private const int TopFailingLimit = 5;

        public async Task<DashboardSummaryResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var now = timeProvider.GetUtcNow();
            var currentStart = now.AddDays(-WindowDays);
            var previousStart = currentStart.AddDays(-WindowDays);

            var visibleProjects = context.Projects.Where(project =>
                project.UserId == currentUser.UserId
                || project.Members.Any(member => member.UserId == currentUser.UserId)
            );
            var visibleProjectIds = visibleProjects.Select(project => project.Id);
            var visibleRuns = context.TestRuns.Where(run =>
                visibleProjectIds.Contains(run.ProjectId)
            );
            var currentRunIds = visibleRuns
                .Where(run => run.CreatedAt >= currentStart && run.CreatedAt < now)
                .Select(run => run.Id);
            var previousRunIds = visibleRuns
                .Where(run => run.CreatedAt >= previousStart && run.CreatedAt < currentStart)
                .Select(run => run.Id);

            var currentResults = context
                .TestResults.Where(result => currentRunIds.Contains(result.TestRunId))
                .CurrentOutcomes();
            var previousResults = context
                .TestResults.Where(result => previousRunIds.Contains(result.TestRunId))
                .CurrentOutcomes();

            var currentCounts = await StatusCounts(currentResults, cancellationToken);
            var previousCounts = await StatusCounts(previousResults, cancellationToken);
            var executed =
                currentCounts.Passed
                + currentCounts.Failed
                + currentCounts.Blocked
                + currentCounts.Skipped;

            var executedResults = currentResults.Where(result =>
                result.Status != TestResultStatus.Untested
            );
            var failingTestCount = await executedResults
                .GroupBy(result => result.TestCaseId)
                .Select(group =>
                    group
                        .OrderByDescending(result => result.TestRun!.CreatedAt)
                        .ThenByDescending(result => result.TestRunId)
                        .Select(result => result.Status)
                        .First()
                )
                .CountAsync(status => status == TestResultStatus.Failed, cancellationToken);

            var topFailingTests = await currentResults
                .Where(result => result.Status == TestResultStatus.Failed)
                .GroupBy(result => new
                {
                    result.TestCaseId,
                    TestCaseName = result.TestCase!.Name,
                    SuiteId = result.TestCase.SuiteId,
                    ProjectId = result.TestRun!.ProjectId,
                    ProjectName = result.TestRun.Project!.Name,
                })
                .Select(group => new FailingTestResponse
                {
                    TestCaseId = group.Key.TestCaseId,
                    TestCaseName = group.Key.TestCaseName,
                    SuiteId = group.Key.SuiteId,
                    ProjectId = group.Key.ProjectId,
                    ProjectName = group.Key.ProjectName,
                    FailureCount = group.Count(),
                    LastFailedAt = group.Max(result => result.TestRun!.CreatedAt),
                })
                .OrderByDescending(result => result.FailureCount)
                .ThenByDescending(result => result.LastFailedAt)
                .ThenBy(result => result.TestCaseName)
                .Take(TopFailingLimit)
                .ToListAsync(cancellationToken);

            var recentRunIds = visibleProjects.SelectMany(project =>
                context
                    .TestRuns.Where(run => run.ProjectId == project.Id)
                    .OrderByDescending(run => run.CreatedAt)
                    .ThenByDescending(run => run.Id)
                    .Take(20)
                    .Select(run => run.Id)
            );
            var flakyCount = await context
                .TestResults.Where(result =>
                    recentRunIds.Contains(result.TestRunId)
                    && result.Status != TestResultStatus.Untested
                )
                .CurrentOutcomes()
                .GroupBy(result => new { result.TestRun!.ProjectId, result.TestCaseId })
                .Where(group =>
                    group.Count() >= 3
                    && group.Any(result => result.Status == TestResultStatus.Passed)
                    && group.Any(result => result.Status == TestResultStatus.Failed)
                )
                .CountAsync(cancellationToken);

            return new DashboardSummaryResponse
            {
                WindowDays = WindowDays,
                PassRate = Rate(currentCounts),
                PreviousPassRate = Rate(previousCounts),
                ExecutedCount = executed,
                FailingTestCount = failingTestCount,
                FlakyTestCount = flakyCount,
                ActiveRunCount = await visibleRuns.CountAsync(
                    run => run.Status == TestRunStatus.Active,
                    cancellationToken
                ),
                TopFailingTests = topFailingTests,
            };
        }

        private static async Task<(int Passed, int Failed, int Blocked, int Skipped)> StatusCounts(
            IQueryable<TestCraft.Domain.Entities.TestResult> results,
            CancellationToken cancellationToken
        )
        {
            var counts = await results
                .GroupBy(result => result.Status)
                .Select(group => new { Status = group.Key, Count = group.Count() })
                .ToDictionaryAsync(item => item.Status, item => item.Count, cancellationToken);
            return (
                counts.GetValueOrDefault(TestResultStatus.Passed),
                counts.GetValueOrDefault(TestResultStatus.Failed),
                counts.GetValueOrDefault(TestResultStatus.Blocked),
                counts.GetValueOrDefault(TestResultStatus.Skipped)
            );
        }

        private static double? Rate((int Passed, int Failed, int Blocked, int Skipped) counts)
        {
            var executed = counts.Passed + counts.Failed + counts.Blocked + counts.Skipped;
            return executed == 0 ? null : Math.Round(counts.Passed * 100.0 / executed, 1);
        }
    }
}
