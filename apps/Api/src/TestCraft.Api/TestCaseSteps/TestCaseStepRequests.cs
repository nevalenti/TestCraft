namespace TestCraft.Api.TestCaseSteps;

public record CreateTestCaseStepRequest
{
    public required int Order { get; init; }
    public required string Action { get; init; }
    public required string ExpectedResult { get; init; }
}

public record UpdateTestCaseStepRequest
{
    public required int Order { get; init; }
    public required string Action { get; init; }
    public required string ExpectedResult { get; init; }
}

public record ReorderStepRequest
{
    public required Guid Id { get; init; }
    public required int Order { get; init; }
}

public record BulkReorderStepsRequest
{
    public required IReadOnlyList<ReorderStepRequest> Steps { get; init; }
}
