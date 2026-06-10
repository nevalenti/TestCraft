using TestCraft.Domain.Enums;

namespace TestCraft.Api.TestResults;

public record CreateTestResultRequest
{
    public required Guid TestCaseId { get; init; }
    public required TestResultStatus Status { get; init; }
    public string? Notes { get; init; }
    public required DateTimeOffset ExecutedAt { get; init; }
}

public record UpdateTestResultRequest
{
    public required TestResultStatus Status { get; init; }
    public string? Notes { get; init; }
}
