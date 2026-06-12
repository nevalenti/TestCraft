namespace TestCraft.Api.Requests;

public record CreateProjectRequest
{
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public record UpdateProjectRequest
{
    public required string Name { get; init; }
    public string? Description { get; init; }
}
