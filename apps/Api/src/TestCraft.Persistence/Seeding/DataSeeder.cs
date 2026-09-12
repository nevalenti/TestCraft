using Bogus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Persistence.Seeding;

public sealed partial class DataSeeder(AppDbContext context, ILogger<DataSeeder> logger)
{
    private const int RandomSeed = 20260101;

    private const double LabelAssignmentProbability = 0.4;
    private const double CiRunProbability = 0.6;
    private const double ActiveRunProbability = 0.5;
    private const double MinResultCoverage = 0.6;
    private const double ResultCoverageRange = 0.4;
    private const double FailureNoteProbability = 0.8;
    private const float ThirdStepProbability = 0.6f;

    private static readonly string[] Branches = ["main", "develop", "release/2.4"];
    private static readonly string[] Environments = ["staging", "production", "ci"];
    private static readonly string[] PlanNames = ["Release Candidate", "Critical Path"];

    public async Task<bool> SeedAsync(
        UserId ownerId,
        bool reset,
        CancellationToken cancellationToken
    )
    {
        if (reset)
        {
            var deleted = await context
                .Projects.Where(project => project.UserId == ownerId)
                .ExecuteDeleteAsync(cancellationToken);

            if (deleted > 0)
            {
                LogReset(logger, deleted);
            }
        }

        var existingNames = await context
            .Projects.Where(project => project.UserId == ownerId)
            .Select(project => project.Name)
            .ToListAsync(cancellationToken);

        var projectsToSeed = SeedContent
            .Projects.Where(project => !existingNames.Contains(project.Name))
            .ToList();

        if (projectsToSeed.Count == 0)
        {
            LogAlreadySeeded(logger);
            return false;
        }

        var faker = new Faker { Random = new Randomizer(RandomSeed) };
        var random = new Random(RandomSeed);

        var teamMembers = SeedContent
            .TeamMemberNames.Select(name => (Name: name, Id: UserId.New()))
            .ToList();

        foreach (var projectSeed in projectsToSeed)
        {
            await SeedProjectAsync(
                projectSeed,
                ownerId,
                teamMembers,
                faker,
                random,
                cancellationToken
            );
        }

        LogCompleted(logger, projectsToSeed.Count);
        return true;
    }

    private async Task SeedProjectAsync(
        SeedProject seed,
        UserId ownerId,
        List<(string Name, UserId Id)> teamMembers,
        Faker faker,
        Random random,
        CancellationToken cancellationToken
    )
    {
        var strategy = context.Database.CreateExecutionStrategy();

        var summary = await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(
                cancellationToken
            );

            var result = await SeedProjectDataAsync(
                seed,
                ownerId,
                teamMembers,
                faker,
                random,
                cancellationToken
            );

            await transaction.CommitAsync(cancellationToken);

            return result;
        });

        LogProjectSeeded(
            logger,
            summary.ProjectName,
            summary.Suites,
            summary.Cases,
            summary.Runs,
            summary.Results
        );
    }

    private async Task<(
        string ProjectName,
        int Suites,
        int Cases,
        int Runs,
        int Results
    )> SeedProjectDataAsync(
        SeedProject seed,
        UserId ownerId,
        List<(string Name, UserId Id)> teamMembers,
        Faker faker,
        Random random,
        CancellationToken cancellationToken
    )
    {
        var project = new Project
        {
            Id = ProjectId.New(),
            Name = seed.Name,
            Description = seed.Description,
            UserId = ownerId,
        };
        context.Projects.Add(project);

        var labels = SeedContent
            .Labels.Select(label => new Label
            {
                Id = LabelId.New(),
                Name = label.Name,
                Color = label.Color,
                ProjectId = project.Id,
                CreatedAt = DateTimeOffset.UtcNow,
            })
            .ToList();
        context.Labels.AddRange(labels);

        var memberCount = random.Next(1, 3);
        var members = Enumerable
            .Range(0, memberCount)
            .Select(_ => new ProjectMember
            {
                Id = ProjectMemberId.New(),
                ProjectId = project.Id,
                UserId = UserId.New(),
                Email = faker.Internet.Email(),
                DisplayName = faker.Name.FullName(),
                CreatedAt = DateTimeOffset.UtcNow,
            })
            .ToList();
        context.ProjectMembers.AddRange(members);

        var suites = new List<TestSuite>();
        var allCases = new List<TestCase>();

        foreach (var suiteSeed in seed.Suites)
        {
            var suite = new TestSuite
            {
                Id = TestSuiteId.New(),
                Name = suiteSeed.Name,
                ProjectId = project.Id,
            };
            suites.Add(suite);

            foreach (var caseTitle in suiteSeed.Cases)
            {
                var testCase = new TestCase
                {
                    Id = TestCaseId.New(),
                    Name = caseTitle,
                    SuiteId = suite.Id,
                    Priority = PickPriority(random),
                };

                var order = 1;
                foreach (var step in BuildSteps(caseTitle, faker))
                {
                    step.Order = order++;
                    step.TestCaseId = testCase.Id;
                    testCase.Steps.Add(step);
                }

                if (random.NextDouble() < LabelAssignmentProbability)
                {
                    var labelCount = random.Next(1, 3);
                    foreach (var label in labels.OrderBy(_ => random.Next()).Take(labelCount))
                    {
                        testCase.TestCaseLabels.Add(
                            new TestCaseLabel { TestCaseId = testCase.Id, LabelId = label.Id }
                        );
                    }
                }

                allCases.Add(testCase);
            }
        }

        context.TestSuites.AddRange(suites);
        context.TestCases.AddRange(allCases);

        var plans = PlanNames.Select(name =>
        {
            var plan = new TestPlan
            {
                Id = TestPlanId.New(),
                Name = name,
                ProjectId = project.Id,
            };

            var order = 0;
            foreach (var planCase in allCases.OrderBy(_ => random.Next()).Take(random.Next(5, 11)))
            {
                plan.TestPlanCases.Add(
                    new TestPlanCase
                    {
                        TestPlanId = plan.Id,
                        TestCaseId = planCase.Id,
                        Order = order++,
                    }
                );
            }

            return plan;
        });
        context.TestPlans.AddRange(plans);

        await context.SaveChangesAsync(cancellationToken);

        var runs = BuildRuns(project.Id, teamMembers, random);
        context.TestRuns.AddRange(runs.Select(r => r.Run));
        await context.SaveChangesAsync(cancellationToken);

        foreach (var (run, createdAt) in runs)
        {
            run.CreatedAt = createdAt;
        }
        await context.SaveChangesAsync(cancellationToken);

        var results = BuildResults(runs, allCases, random);
        context.TestResults.AddRange(results);

        var oldestCompleted = runs.Where(r => r.Run.Status == TestRunStatus.Completed)
            .MinBy(r => r.CreatedAt);
        oldestCompleted.Run?.TransitionTo(TestRunStatus.Archived);

        await context.SaveChangesAsync(cancellationToken);

        return (project.Name, suites.Count, allCases.Count, runs.Count, results.Count);
    }

    private static List<(TestRun Run, DateTimeOffset CreatedAt)> BuildRuns(
        ProjectId projectId,
        List<(string Name, UserId Id)> teamMembers,
        Random random
    )
    {
        var runCount = random.Next(6, 11);
        var runs = new List<(TestRun, DateTimeOffset)>(runCount);

        for (var i = 0; i < runCount; i++)
        {
            var createdAt =
                i == 0
                    ? DateTimeOffset.UtcNow.AddMinutes(-random.Next(5, 240))
                    : DateTimeOffset
                        .UtcNow.AddDays(-random.Next(1, 60))
                        .AddHours(-random.Next(0, 23));

            TestRun run;
            if (random.NextDouble() < CiRunProbability)
            {
                var source = SeedContent.CiSources[random.Next(SeedContent.CiSources.Count)];
                var branch = Branches[random.Next(Branches.Length)];
                run = new TestRun
                {
                    Id = TestRunId.New(),
                    Name = $"#{random.Next(100_000, 999_999)} {source} ({branch})",
                    Environment = "ci",
                    Source = source,
                    ProjectId = projectId,
                };
            }
            else
            {
                var member = teamMembers[random.Next(teamMembers.Count)];
                run = new TestRun
                {
                    Id = TestRunId.New(),
                    Name = SeedContent.ManualRunNames[
                        random.Next(SeedContent.ManualRunNames.Count)
                    ],
                    Environment = Environments[random.Next(Environments.Length)],
                    ExecutedById = member.Id,
                    ExecutedByName = member.Name,
                    ProjectId = projectId,
                };
            }

            runs.Add((run, createdAt));
        }

        return runs;
    }

    private static List<TestResult> BuildResults(
        List<(TestRun Run, DateTimeOffset CreatedAt)> runs,
        List<TestCase> allCases,
        Random random
    )
    {
        var results = new List<TestResult>();
        var newestFirst = runs.OrderByDescending(r => r.CreatedAt).ToList();

        for (var i = 0; i < newestFirst.Count; i++)
        {
            var (run, createdAt) = newestFirst[i];
            var coverage = MinResultCoverage + random.NextDouble() * ResultCoverageRange;
            var casesForRun = allCases
                .OrderBy(_ => random.Next())
                .Take((int)(allCases.Count * coverage))
                .ToList();

            var isActive = i == 0 && random.NextDouble() < ActiveRunProbability;
            var casesToExecute = isActive
                ? casesForRun.Take(Math.Max(1, casesForRun.Count / 2)).ToList()
                : casesForRun;

            foreach (var testCase in casesToExecute)
            {
                var status = PickStatus(random);
                string? notes = null;
                DefectType? defectType = null;

                if (
                    status is TestResultStatus.Failed
                    && random.NextDouble() < FailureNoteProbability
                )
                {
                    var (message, defect) = SeedContent.FailureNotes[
                        random.Next(SeedContent.FailureNotes.Count)
                    ];
                    notes = message;
                    defectType = Enum.Parse<DefectType>(defect);
                }

                results.Add(
                    new TestResult
                    {
                        Id = TestResultId.New(),
                        TestRunId = run.Id,
                        TestCaseId = testCase.Id,
                        Status = status,
                        Notes = notes,
                        DefectType = defectType,
                        DurationMs = random.Next(80, 6000),
                        ExecutedAt = createdAt.AddMinutes(random.Next(0, 45)),
                        ExecutedById = run.ExecutedById,
                    }
                );
            }

            if (!isActive)
            {
                run.TransitionTo(TestRunStatus.Completed);
            }
        }

        return results;
    }

    private static TestCasePriority PickPriority(Random random) =>
        random.NextDouble() switch
        {
            < 0.20 => TestCasePriority.Low,
            < 0.60 => TestCasePriority.Medium,
            < 0.90 => TestCasePriority.High,
            _ => TestCasePriority.Critical,
        };

    private static TestResultStatus PickStatus(Random random) =>
        random.NextDouble() switch
        {
            < 0.70 => TestResultStatus.Passed,
            < 0.85 => TestResultStatus.Failed,
            < 0.95 => TestResultStatus.Skipped,
            _ => TestResultStatus.Blocked,
        };

    private static List<TestCaseStep> BuildSteps(string caseTitle, Faker faker)
    {
        var isNegativeCase =
            caseTitle.Contains("error", StringComparison.OrdinalIgnoreCase)
            || caseTitle.Contains("invalid", StringComparison.OrdinalIgnoreCase)
            || caseTitle.Contains("reject", StringComparison.OrdinalIgnoreCase)
            || caseTitle.Contains("block", StringComparison.OrdinalIgnoreCase)
            || caseTitle.Contains("fail", StringComparison.OrdinalIgnoreCase);

        var steps = new List<TestCaseStep>
        {
            new()
            {
                Id = TestCaseStepId.New(),
                Action = "Navigate to the relevant section and sign in as a test user",
                ExpectedResult = "The page loads without errors",
            },
            new()
            {
                Id = TestCaseStepId.New(),
                Action = caseTitle,
                ExpectedResult = isNegativeCase
                    ? "An appropriate error message is shown and no state is changed"
                    : "The expected result is reflected immediately in the UI/response",
            },
        };

        if (faker.Random.Bool(ThirdStepProbability))
        {
            steps.Add(
                new TestCaseStep
                {
                    Id = TestCaseStepId.New(),
                    Action = "Refresh the page or re-fetch the resource",
                    ExpectedResult = "The change persists as expected",
                }
            );
        }

        return steps;
    }

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Deleted {Count} existing project(s) before reseeding"
    )]
    private static partial void LogReset(ILogger logger, int count);

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Owner already has projects — skipping seed (pass --reset to reseed)"
    )]
    private static partial void LogAlreadySeeded(ILogger logger);

    [LoggerMessage(Level = LogLevel.Information, Message = "Seeded {Count} project(s)")]
    private static partial void LogCompleted(ILogger logger, int count);

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Seeded '{Project}': {Suites} suites, {Cases} cases, {Runs} runs, {Results} results"
    )]
    private static partial void LogProjectSeeded(
        ILogger logger,
        string project,
        int suites,
        int cases,
        int runs,
        int results
    );
}
