using TestCraft.Domain.Enums;

namespace TestCraft.Api.Requests;

public record CreateTestCaseRequest
{
    public required string Name { get; init; }
    public string? Description { get; init; }
    public TestCasePriority? Priority { get; init; }
}

public record UpdateTestCaseRequest
{
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required TestCasePriority Priority { get; init; }
}
