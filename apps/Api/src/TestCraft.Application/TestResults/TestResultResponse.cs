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
    public long? DurationMs { get; init; }
    public DefectType? DefectType { get; init; }
    public required DateTimeOffset ExecutedAt { get; init; }
    public Guid? ExecutedById { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
}
