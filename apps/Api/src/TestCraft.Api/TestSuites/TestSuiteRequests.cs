namespace TestCraft.Api.TestSuites;

public record CreateTestSuiteRequest
{
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public record UpdateTestSuiteRequest
{
    public required string Name { get; init; }
    public string? Description { get; init; }
}
