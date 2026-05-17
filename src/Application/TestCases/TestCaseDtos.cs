namespace Application.TestCases;

public record TestCaseDto(Guid Id, Guid SuiteId, string Name, string? Description, DateTime CreatedAt, DateTime? UpdatedAt);
public record CreateTestCaseDto(string Name, string? Description);
public record UpdateTestCaseDto(string Name, string? Description);