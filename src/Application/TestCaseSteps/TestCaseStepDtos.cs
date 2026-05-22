namespace Application.TestCaseSteps;

public record TestCaseStepDto(Guid Id, Guid TestCaseId, int Order, string Action, string ExpectedResult, DateTime CreatedAt, DateTime? UpdatedAt);
public record CreateTestCaseStepDto(int Order, string Action, string ExpectedResult);
public record UpdateTestCaseStepDto(int Order, string Action, string ExpectedResult);
public record BulkReorderStepsDto(IList<StepOrderDto> Steps);
public record StepOrderDto(Guid Id, int Order);