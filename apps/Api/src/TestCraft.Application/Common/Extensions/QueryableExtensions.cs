using TestCraft.Application.Features.Labels;
using TestCraft.Application.Features.TestCases;
using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Common.Extensions;

public static class QueryableExtensions
{
    public static IQueryable<TestCaseResponse> ToTestCaseResponse(
        this IQueryable<TestCase> query
    ) =>
        query.Select(testCase => new TestCaseResponse
        {
            Id = testCase.Id,
            SuiteId = testCase.SuiteId,
            Name = testCase.Name,
            Description = testCase.Description,
            Priority = testCase.Priority,
            StepCount = testCase.Steps.Count(step => !step.IsDeleted),
            CreatedAt = testCase.CreatedAt,
            UpdatedAt = testCase.UpdatedAt,
            Labels = testCase
                .TestCaseLabels.Select(tcl => new LabelResponse
                {
                    Id = tcl.Label!.Id,
                    Name = tcl.Label.Name,
                    Color = tcl.Label.Color,
                    ProjectId = tcl.Label.ProjectId,
                })
                .ToList(),
        });

    public static IQueryable<TestResultResponse> ToTestResultResponse(
        this IQueryable<TestResult> query
    ) =>
        query.Select(result => new TestResultResponse
        {
            Id = result.Id,
            TestRunId = result.TestRunId,
            TestCaseId = result.TestCaseId,
            SuiteId = result.TestCase!.SuiteId,
            TestCaseName = result.TestCase.Name,
            Status = result.Status,
            Notes = result.Notes,
            DurationMs = result.DurationMs,
            DefectType = result.DefectType,
            ExecutedAt = result.ExecutedAt,
            ExecutedById = result.ExecutedById,
            CreatedAt = result.CreatedAt,
            UpdatedAt = result.UpdatedAt,
        });
}
