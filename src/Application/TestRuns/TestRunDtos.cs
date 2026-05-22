using Domain.Enums;

namespace Application.TestRuns;

public record TestRunDto(Guid Id, Guid ProjectId, string Name, string Environment, TestRunStatus Status, Guid? ExecutedById, DateTime CreatedAt, DateTime? UpdatedAt);
public record CreateTestRunDto(string Name, string Environment, TestRunStatus Status = TestRunStatus.Active);
public record UpdateTestRunDto(string Name, string Environment, TestRunStatus Status);
public record TestRunSummaryDto(int Total, int Passed, int Failed, int Blocked, int Skipped, int PassRate);