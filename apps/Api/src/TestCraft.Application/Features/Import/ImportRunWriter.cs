using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Import;

internal static class ImportRunWriter
{
    public static async Task<TestRunResponse> CreateRunWithResultsAsync(
        IApplicationDbContext context,
        Guid projectId,
        string name,
        string environment,
        TestRunStatus status,
        IReadOnlyList<ParsedTestCase> cases,
        Guid userId,
        string? userName,
        string? source,
        ImportJob job,
        CancellationToken cancellationToken
    )
    {
        var strategy = context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(
                cancellationToken
            );

            var now = DateTimeOffset.UtcNow;

            var run = new TestRun
            {
                ProjectId = projectId,
                Name = name,
                Environment = environment,
                Source = source,
                ExecutedById = userId,
                ExecutedByName = userName,
            };

            if (status != TestRunStatus.Active)
                run.TransitionTo(status);

            context.TestRuns.Add(run);
            await context.SaveChangesAsync(cancellationToken);

            await InsertResultsAsync(
                context,
                projectId,
                run.Id,
                cases,
                now,
                userId,
                source,
                cancellationToken
            );

            job.Status = ImportJobStatus.Completed;
            job.TestRunId = run.Id;
            await context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return TestRunResponse.FromEntity(run);
        });
    }

    public static async Task<TestRunResponse> AppendResultsToRunAsync(
        IApplicationDbContext context,
        Guid projectId,
        Guid runId,
        IReadOnlyList<ParsedTestCase> cases,
        Guid userId,
        string? source,
        ImportJob job,
        CancellationToken cancellationToken
    )
    {
        var strategy = context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(
                cancellationToken
            );

            var run =
                await context.TestRuns.FirstOrDefaultAsync(
                    testRun => testRun.Id == runId && testRun.ProjectId == projectId,
                    cancellationToken
                )
                ?? throw new InvalidOperationException(
                    $"Run {runId} not found in project {projectId}"
                );

            var now = DateTimeOffset.UtcNow;

            await InsertResultsAsync(
                context,
                projectId,
                run.Id,
                cases,
                now,
                userId,
                source,
                cancellationToken
            );

            run.TransitionTo(TestRunStatus.Completed);
            job.Status = ImportJobStatus.Completed;
            job.TestRunId = run.Id;
            await context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return TestRunResponse.FromEntity(run);
        });
    }

    private static async Task InsertResultsAsync(
        IApplicationDbContext context,
        Guid projectId,
        Guid runId,
        IReadOnlyList<ParsedTestCase> cases,
        DateTimeOffset now,
        Guid userId,
        string? source,
        CancellationToken cancellationToken
    )
    {
        var suiteMap = await ResolveSuitesAsync(
            context,
            projectId,
            cases,
            source,
            cancellationToken
        );
        var caseMap = await ResolveTestCasesAsync(context, suiteMap, cases, cancellationToken);

        await InsertTestResultsAsync(
            context,
            runId,
            suiteMap,
            caseMap,
            cases,
            now,
            userId,
            cancellationToken
        );
    }

    private static async Task<Dictionary<string, Guid>> ResolveSuitesAsync(
        IApplicationDbContext context,
        Guid projectId,
        IReadOnlyList<ParsedTestCase> cases,
        string? source,
        CancellationToken cancellationToken
    )
    {
        var uniqueSuiteNames = cases.Select(parsedCase => parsedCase.SuiteName).Distinct().ToList();

        var existingSuites = await context
            .TestSuites.Where(suite =>
                suite.ProjectId == projectId && uniqueSuiteNames.Contains(suite.Name)
            )
            .ToListAsync(cancellationToken);

        var suiteMap = existingSuites.ToDictionary(suite => suite.Name, suite => suite.Id);

        if (!string.IsNullOrEmpty(source))
        {
            foreach (
                var suite in existingSuites.Where(existingSuite =>
                    string.IsNullOrEmpty(existingSuite.Source)
                )
            )
            {
                suite.Source = source;
            }
        }

        var newSuites = new Dictionary<string, TestSuite>();
        foreach (var suiteName in uniqueSuiteNames)
        {
            if (suiteMap.ContainsKey(suiteName))
            {
                continue;
            }

            var suite = new TestSuite
            {
                ProjectId = projectId,
                Name = suiteName,
                Source = source,
            };

            context.TestSuites.Add(suite);
            newSuites[suiteName] = suite;
        }

        if (existingSuites.Count > 0 || newSuites.Count > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        foreach (var (suiteName, suite) in newSuites)
        {
            suiteMap[suiteName] = suite.Id;
        }

        return suiteMap;
    }

    private static async Task<Dictionary<(Guid SuiteId, string Name), Guid>> ResolveTestCasesAsync(
        IApplicationDbContext context,
        IReadOnlyDictionary<string, Guid> suiteMap,
        IReadOnlyList<ParsedTestCase> cases,
        CancellationToken cancellationToken
    )
    {
        var suiteIds = suiteMap.Values.ToList();
        var uniqueCaseNames = cases.Select(parsedCase => parsedCase.CaseName).Distinct().ToList();

        var existingCases = await context
            .TestCases.Where(testCase =>
                suiteIds.Contains(testCase.SuiteId) && uniqueCaseNames.Contains(testCase.Name)
            )
            .ToListAsync(cancellationToken);

        var caseMap = existingCases.ToDictionary(
            testCase => (testCase.SuiteId, testCase.Name),
            testCase => testCase.Id
        );

        var newCases = new Dictionary<(Guid SuiteId, string Name), TestCase>();
        foreach (var parsedCase in cases)
        {
            var suiteId = suiteMap[parsedCase.SuiteName];
            var key = (suiteId, parsedCase.CaseName);

            if (caseMap.ContainsKey(key) || newCases.ContainsKey(key))
            {
                continue;
            }

            var testCase = new TestCase { SuiteId = suiteId, Name = parsedCase.CaseName };

            if (parsedCase.Steps is { Count: > 0 })
            {
                foreach (var step in parsedCase.Steps)
                {
                    testCase.Steps.Add(
                        new TestCaseStep
                        {
                            Order = step.Order,
                            Action = step.Action,
                            ExpectedResult = step.ExpectedResult,
                        }
                    );
                }
            }

            context.TestCases.Add(testCase);
            newCases[key] = testCase;
        }

        if (newCases.Count > 0)
        {
            await context.SaveChangesAsync(cancellationToken);

            foreach (var (key, testCase) in newCases)
            {
                caseMap[key] = testCase.Id;
            }
        }

        return caseMap;
    }

    private static async Task InsertTestResultsAsync(
        IApplicationDbContext context,
        Guid runId,
        Dictionary<string, Guid> suiteMap,
        Dictionary<(Guid SuiteId, string Name), Guid> caseMap,
        IReadOnlyList<ParsedTestCase> cases,
        DateTimeOffset now,
        Guid userId,
        CancellationToken cancellationToken
    )
    {
        if (cases.Count == 0)
        {
            return;
        }

        foreach (var parsedCase in cases)
        {
            var suiteId = suiteMap[parsedCase.SuiteName];
            var key = (suiteId, parsedCase.CaseName);

            context.TestResults.Add(
                new TestResult
                {
                    TestRunId = runId,
                    TestCaseId = caseMap[key],
                    Status = parsedCase.Status,
                    Notes = parsedCase.Notes,
                    DurationMs = parsedCase.DurationMs,
                    ExecutedAt = now,
                    ExecutedById = userId,
                }
            );
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
