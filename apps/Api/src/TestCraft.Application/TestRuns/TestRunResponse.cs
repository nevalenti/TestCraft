using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestRuns;

public record TestRunResponse
{
    public required Guid Id { get; init; }
    public required Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Environment { get; init; }
    public required TestRunStatus Status { get; init; }
    public string? Source { get; init; }
    public Guid? ExecutedById { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
}
