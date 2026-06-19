namespace TestCraft.Domain.Entities;

public class Label
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Color { get; set; }
    public Guid ProjectId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; set; }
    public ICollection<TestCaseLabel> TestCaseLabels { get; set; } = [];
}
