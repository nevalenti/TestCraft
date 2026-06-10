using TestCraft.Domain.Enums;

namespace TestCraft.Application.Import;

public record ParsedStep
{
    public required int Order { get; init; }
    public required string Action { get; init; }
    public required string ExpectedResult { get; init; }
}

public record ParsedTestCase
{
    public required string SuiteName { get; init; }
    public required string CaseName { get; init; }
    public required TestResultStatus Status { get; init; }
    public string? Notes { get; init; }
    public IReadOnlyList<ParsedStep>? Steps { get; init; }
}
