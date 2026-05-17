namespace Application.TestRuns;

public record TestRunDto(Guid Id, Guid ProjectId, string Name, string Environment, Guid? ExecutedById, DateTime CreatedAt, DateTime? UpdatedAt);
public record CreateTestRunDto(string Name, string Environment);
public record UpdateTestRunDto(string Name, string Environment);