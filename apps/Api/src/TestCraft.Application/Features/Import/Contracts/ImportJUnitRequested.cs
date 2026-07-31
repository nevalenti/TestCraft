namespace TestCraft.Application.Features.Import.Contracts;

public record ImportJUnitRequested
{
    public required Guid JobId { get; init; }
    public required Guid ProjectId { get; init; }
    public required string Xml { get; init; }
    public required string Environment { get; init; }
    public string? Name { get; init; }
    public string? Source { get; init; }
    public Guid? RunId { get; init; }
    public required Guid UserId { get; init; }
    public string? UserName { get; init; }
}
