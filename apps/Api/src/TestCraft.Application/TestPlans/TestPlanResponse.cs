namespace TestCraft.Application.TestPlans;

public record TestPlanResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required Guid ProjectId { get; init; }
    public required int CaseCount { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
}

public record TestPlanDetailResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required Guid ProjectId { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required IReadOnlyList<TestPlanCaseResponse> Cases { get; init; }
}

public record TestPlanCaseResponse
{
    public required Guid TestCaseId { get; init; }
    public required string TestCaseName { get; init; }
    public required string SuiteName { get; init; }
    public required int Order { get; init; }
}
