using System.Text.Json.Serialization;

namespace TestCraft.Api.Errors;

public record ProblemResponse
{
    public required string Type { get; init; }
    public required string Title { get; init; }
    public required int Status { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Detail { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Instance { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Code { get; init; }
}

public record FieldError(string Field, string Message)
{
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
#pragma warning disable CA1720 // The contract names this member `pointer`.
    public string? Pointer { get; init; }
#pragma warning restore CA1720

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? Location { get; init; }
}

public record ValidationProblemResponse : ProblemResponse
{
    public required IReadOnlyList<FieldError> Errors { get; init; }
}
