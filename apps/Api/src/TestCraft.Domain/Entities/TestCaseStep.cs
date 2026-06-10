namespace TestCraft.Domain.Entities;

public class TestCaseStep : IAuditableEntity
{
    public Guid Id { get; set; }
    public int Order { get; set; }
    public required string Action { get; set; }
    public required string ExpectedResult { get; set; }
    public Guid TestCaseId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public TestCase? TestCase { get; set; }
}
