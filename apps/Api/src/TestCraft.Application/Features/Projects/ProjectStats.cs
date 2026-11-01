using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Projects;

public static class ProjectStats
{
    public const int RecentRunLimit = 10;

    public static async Task<ProjectResponse> LoadAsync(
        IApplicationDbContext context,
        ProjectId projectId,
        UserId userId,
        CancellationToken cancellationToken
    )
    {
        var project =
            await context
                .Projects.Where(project => project.Id == projectId)
                .Select(ProjectResponse.For(userId))
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();

        var withRates = await new[] { project }.WithRecentPassRatesAsync(
            context,
            cancellationToken
        );

        return withRates[0];
    }

    public static async Task<IReadOnlyList<ProjectResponse>> WithRecentPassRatesAsync(
        this IReadOnlyList<ProjectResponse> projects,
        IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (projects.Count == 0)
        {
            return projects;
        }

        var projectIds = projects.Select(project => project.Id).ToList();

        var recentRuns = context
            .Projects.Where(project => projectIds.Contains(project.Id))
            .SelectMany(project =>
                project
                    .TestRuns.Where(run =>
                        run.Status == TestRunStatus.Completed
                        && run.TestResults.Any(result => result.Status != TestResultStatus.Untested)
                    )
                    .OrderByDescending(run => run.CreatedAt)
                    .Take(RecentRunLimit)
            );

        var perRun = await context
            .TestResults.CurrentOutcomes()
            .Where(result => recentRuns.Any(run => run.Id == result.TestRunId))
            .GroupBy(result => new
            {
                result.TestRun!.ProjectId,
                result.TestRunId,
                result.TestRun.CreatedAt,
            })
            .Select(group => new
            {
                group.Key.ProjectId,
                group.Key.CreatedAt,
                Passed = group.Count(result => result.Status == TestResultStatus.Passed),
                Executed = group.Count(result => result.Status != TestResultStatus.Untested),
            })
            .ToListAsync(cancellationToken);

        var ratesByProject = perRun
            .Where(run => run.Executed > 0)
            .GroupBy(run => run.ProjectId)
            .ToDictionary(
                runs => runs.Key,
                runs =>
                    (IReadOnlyList<decimal>)
                        runs.OrderBy(run => run.CreatedAt)
                            .Select(run =>
                                Math.Round(
                                    run.Passed * 100m / run.Executed,
                                    1,
                                    MidpointRounding.AwayFromZero
                                )
                            )
                            .ToList()
            );

        return projects
            .Select(project =>
                ratesByProject.TryGetValue(project.Id, out var rates)
                    ? project with
                    {
                        RecentPassRates = rates,
                    }
                    : project
            )
            .ToList();
    }
}
