using TestCraft.Domain.Enums;

namespace TestCraft.Api.Requests;

public record CreateTestRunRequest
{
    public required string Name { get; init; }
    public required string Environment { get; init; }
    public TestRunStatus? Status { get; init; }
}

public record UpdateTestRunRequest
{
    public required string Name { get; init; }
    public required string Environment { get; init; }
    public required TestRunStatus Status { get; init; }
}
