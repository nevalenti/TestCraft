using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class TestRun : IAuditableEntity
{
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
}
