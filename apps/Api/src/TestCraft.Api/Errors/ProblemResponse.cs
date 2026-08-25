namespace TestCraft.Api.Errors;

public record ProblemResponse
{
    public required string Type { get; init; }
    public required string Title { get; init; }
    public required int Status { get; init; }
    public string? Detail { get; init; }
    public string? Instance { get; init; }
    public string? Code { get; init; }
}

public record FieldError(string Field, string Message);

public record ValidationProblemResponse : ProblemResponse
{
    public required IReadOnlyList<FieldError> Errors { get; init; }
}
