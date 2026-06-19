namespace TestCraft.Application.Labels;

public record LabelResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Color { get; init; }
    public required Guid ProjectId { get; init; }
}
