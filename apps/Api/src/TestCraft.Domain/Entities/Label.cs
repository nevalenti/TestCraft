namespace TestCraft.Domain.Entities;

public class Label
{
    public LabelId Id { get; set; }
    public required string Name { get; set; }
    public required string Color { get; set; }
    public ProjectId ProjectId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; set; }
    public ICollection<TestCaseLabel> TestCaseLabels { get; set; } = [];
}
