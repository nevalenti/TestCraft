using System.Linq.Expressions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestResults;

public record TestResultResponse
{
    public required Guid Id { get; init; }
    public required Guid TestRunId { get; init; }
    public required Guid TestCaseId { get; init; }
    public required Guid SuiteId { get; init; }
    public required string TestCaseName { get; init; }
    public required TestResultStatus Status { get; init; }
    public string? Notes { get; init; }
    public required DateTimeOffset ExecutedAt { get; init; }
    public Guid? ExecutedById { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }

    internal static readonly Expression<
        Func<TestResult, TestResultResponse>
    > Projection = r => new TestResultResponse
    {
        Id = r.Id,
        TestRunId = r.TestRunId,
        TestCaseId = r.TestCaseId,
        SuiteId = r.TestCase!.SuiteId,
        TestCaseName = r.TestCase!.Name,
        Status = r.Status,
        Notes = r.Notes,
        ExecutedAt = r.ExecutedAt,
        ExecutedById = r.ExecutedById,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt,
    };
}
