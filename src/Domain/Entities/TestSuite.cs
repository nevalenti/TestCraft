namespace Domain.Entities;

public class TestSuite : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public ICollection<TestCase> TestCases { get; set; } = [];
}