namespace TestCraft.Domain.Entities;

public class TestSuite : SoftDeletableEntity
{
    public TestSuiteId Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Source { get; set; }
    public ProjectId ProjectId { get; set; }

    public Project? Project { get; set; }
    public ICollection<TestCase> TestCases { get; set; } = [];

    public void Update(string name, string? description)
    {
        Name = name;
        Description = description;
    }
}
