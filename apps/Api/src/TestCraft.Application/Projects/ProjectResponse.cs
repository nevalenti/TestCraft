namespace TestCraft.Application.Projects;

public record ProjectResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public required int SuiteCount { get; init; }
    public required int RunCount { get; init; }
}
