namespace TestCraft.Application.TestSuites;

public record TestSuiteResponse
{
    public required Guid Id { get; init; }
    public required Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public string? Source { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
}
