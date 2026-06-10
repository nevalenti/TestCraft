namespace TestCraft.Domain.Entities;

public class Project : IAuditableEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<TestSuite> TestSuites { get; set; } = [];
    public ICollection<TestRun> TestRuns { get; set; } = [];
}
