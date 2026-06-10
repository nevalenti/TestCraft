using TestCraft.Application.Import;

namespace TestCraft.Api.Import;

public record ImportJUnitRequest
{
    public required string Xml { get; init; }
    public required string Environment { get; init; }
    public string? Name { get; init; }
    public string? Source { get; init; }
}

public record ImportAllureRequest
{
    public required IReadOnlyList<AllureResultItem> Results { get; init; }
    public required string Environment { get; init; }
    public string? Name { get; init; }
    public string? Source { get; init; }
}
