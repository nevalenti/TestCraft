using Domain.Enums;

namespace Application.TestCases;

public record TestCaseDto(Guid Id, Guid SuiteId, string Name, string? Description, TestCasePriority Priority, int StepCount, DateTime CreatedAt, DateTime? UpdatedAt);
public record CreateTestCaseDto(string Name, string? Description, TestCasePriority Priority = TestCasePriority.Medium);
public record UpdateTestCaseDto(string Name, string? Description, TestCasePriority Priority);