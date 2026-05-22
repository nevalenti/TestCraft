using Domain.Enums;

namespace Domain.Entities;

public class TestRun : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public TestRunStatus Status { get; set; } = TestRunStatus.Active;
    public Guid? ExecutedById { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public ICollection<TestResult> TestResults { get; set; } = [];
}