namespace TestCraft.Domain.Entities;

public class TestSuite : IAuditableEntity, ISoftDeletableEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Source { get; set; }
    public Guid ProjectId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public Project? Project { get; set; }
    public ICollection<TestCase> TestCases { get; set; } = [];

    public void Update(string name, string? description)
    {
        Name = name;
        Description = description;
    }
}
