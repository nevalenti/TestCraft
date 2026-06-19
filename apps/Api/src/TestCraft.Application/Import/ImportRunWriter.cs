using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.TestRuns;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Import;

internal static class ImportRunWriter
{
    public static async Task<TestRunResponse> CreateRunWithResultsAsync(
        IApplicationDbContext context,
        IMapper mapper,
        Guid projectId,
        string name,
        string environment,
        TestRunStatus status,
        IReadOnlyList<ParsedTestCase> cases,
        Guid userId,
        string? source,
        ImportJob job,
        CancellationToken cancellationToken
    )
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
            Status = status,
            Source = source,
            ExecutedById = userId,
        };

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

        return mapper.Map<TestRunResponse>(run);
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
        var uniqueSuiteNames = cases.Select(c => c.SuiteName).Distinct().ToList();

        var existingSuites = await context
            .TestSuites.Where(s => s.ProjectId == projectId && uniqueSuiteNames.Contains(s.Name))
            .ToListAsync(cancellationToken);

        var suiteMap = existingSuites.ToDictionary(s => s.Name, s => s.Id);

        if (!string.IsNullOrEmpty(source))
        {
            foreach (var suite in existingSuites.Where(s => string.IsNullOrEmpty(s.Source)))
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
        var uniqueCaseNames = cases.Select(c => c.CaseName).Distinct().ToList();

        var existingCases = await context
            .TestCases.Where(c => suiteIds.Contains(c.SuiteId) && uniqueCaseNames.Contains(c.Name))
            .ToListAsync(cancellationToken);

        var caseMap = existingCases.ToDictionary(c => (c.SuiteId, c.Name), c => c.Id);

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
        var dedupedCases = new Dictionary<(Guid SuiteId, string Name), ParsedTestCase>();
        foreach (var parsedCase in cases)
        {
            var suiteId = suiteMap[parsedCase.SuiteName];
            dedupedCases[(suiteId, parsedCase.CaseName)] = parsedCase;
        }

        if (dedupedCases.Count == 0)
        {
            return;
        }

        foreach (var (key, parsedCase) in dedupedCases)
        {
            context.TestResults.Add(
                new TestResult
                {
                    TestRunId = runId,
                    TestCaseId = caseMap[key],
                    Status = parsedCase.Status,
                    Notes = parsedCase.Notes,
                    ExecutedAt = now,
                    ExecutedById = userId,
                }
            );
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
