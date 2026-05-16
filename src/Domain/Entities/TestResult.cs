using Domain.Enums;

namespace Domain.Entities;

public class TestResult : BaseEntity
{
    public TestResultStatus Status { get; set; }
    public string? Notes { get; set; }
    public DateTime ExecutedAt { get; set; }
    public Guid? ExecutedById { get; set; }

    public Guid TestRunId { get; set; }
    public TestRun TestRun { get; set; } = null!;

    public Guid TestCaseId { get; set; }
    public TestCase TestCase { get; set; } = null!;
}