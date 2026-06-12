namespace TestCraft.Application.Responses;

public record TestRunStatusResponse
{
    public required int Total { get; init; }
    public required int Passed { get; init; }
    public required int Failed { get; init; }
    public required int Blocked { get; init; }
    public required int Skipped { get; init; }
    public required int PassRate { get; init; }
}
