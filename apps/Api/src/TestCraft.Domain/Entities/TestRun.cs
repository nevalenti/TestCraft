using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class TestRun : IAuditableEntity
{
    private static readonly Dictionary<TestRunStatus, int> StatusOrder = new()
    {
        [TestRunStatus.Active] = 0,
        [TestRunStatus.Completed] = 1,
        [TestRunStatus.Archived] = 2,
    };

    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Environment { get; set; }
    public TestRunStatus Status { get; set; } = TestRunStatus.Active;
    public string? Source { get; set; }
    public Guid? ExecutedById { get; set; }
    public Guid ProjectId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public Project? Project { get; set; }
    public ICollection<TestResult> TestResults { get; set; } = [];
    public ICollection<ShareToken> ShareTokens { get; set; } = [];

    public bool CanTransitionTo(TestRunStatus to) => StatusOrder[to] >= StatusOrder[Status];

    public bool CanAddResult() => Status != TestRunStatus.Archived;
}
