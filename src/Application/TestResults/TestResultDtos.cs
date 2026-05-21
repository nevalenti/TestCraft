using Domain.Enums;

namespace Application.TestResults;

public record TestResultDto(Guid Id, Guid TestRunId, Guid TestCaseId, string TestCaseName, TestResultStatus Status, string? Notes, DateTime ExecutedAt, Guid? ExecutedById, DateTime CreatedAt, DateTime? UpdatedAt);
public record CreateTestResultDto(Guid TestCaseId, TestResultStatus Status, string? Notes, DateTime ExecutedAt);
public record UpdateTestResultDto(TestResultStatus Status, string? Notes);