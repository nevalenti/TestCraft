namespace TestCraft.Application.Import;

public record AllureStatusDetails
{
    public string? Message { get; init; }
    public string? Trace { get; init; }
}

public record AllureLabel
{
    public required string Name { get; init; }
    public required string Value { get; init; }
}

public record AllureResultItem
{
    public string? Name { get; init; }
    public string? FullName { get; init; }
    public string? Status { get; init; }
    public AllureStatusDetails? StatusDetails { get; init; }
    public IReadOnlyList<AllureLabel>? Labels { get; init; }
}
