namespace TestCraft.Application.Import.Contracts;

public record ImportAllureRequested
{
    public required Guid JobId { get; init; }
    public required Guid ProjectId { get; init; }
    public required IReadOnlyList<AllureResultItem> Results { get; init; }
    public required string Environment { get; init; }
    public string? Name { get; init; }
    public string? Source { get; init; }
    public required Guid UserId { get; init; }
    public string? UserName { get; init; }
}
