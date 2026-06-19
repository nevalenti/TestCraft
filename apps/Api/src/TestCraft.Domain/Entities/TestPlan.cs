namespace TestCraft.Domain.Entities;

public class TestPlan : IAuditableEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public Guid ProjectId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public Project? Project { get; set; }
    public ICollection<TestPlanCase> TestPlanCases { get; set; } = [];
}
