namespace Domain.Entities;

public class TestRun : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public Guid? ExecutedById { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public ICollection<TestResult> TestResults { get; set; } = [];
}