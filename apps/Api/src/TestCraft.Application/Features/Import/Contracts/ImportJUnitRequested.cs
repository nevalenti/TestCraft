namespace TestCraft.Application.Features.Import.Contracts;

public record ImportJUnitRequested
{
    public required ImportJobId JobId { get; init; }
    public required ProjectId ProjectId { get; init; }
    public required string Xml { get; init; }
    public required string Environment { get; init; }
    public string? Name { get; init; }
    public string? Source { get; init; }
    public TestRunId? RunId { get; init; }
    public required UserId UserId { get; init; }
    public string? UserName { get; init; }
}
