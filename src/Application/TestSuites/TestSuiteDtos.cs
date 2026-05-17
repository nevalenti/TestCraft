namespace Application.TestSuites;

public record TestSuiteDto(Guid Id, Guid ProjectId, string Name, string? Description, DateTime CreatedAt, DateTime? UpdatedAt);
public record CreateTestSuiteDto(string Name, string? Description);
public record UpdateTestSuiteDto(string Name, string? Description);