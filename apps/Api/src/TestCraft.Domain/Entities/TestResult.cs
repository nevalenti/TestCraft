using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class TestResult : IAuditableEntity
{
    public Guid Id { get; set; }
    public TestResultStatus Status { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset ExecutedAt { get; set; }
    public Guid? ExecutedById { get; set; }
    public Guid TestRunId { get; set; }
    public Guid TestCaseId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public TestRun? TestRun { get; set; }
    public TestCase? TestCase { get; set; }
}
