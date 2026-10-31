namespace TestCraft.Domain.Entities;

public class Label : IVersioned
{
    public LabelId Id { get; set; }
    public int Version { get; private set; } = 1;
    public required string Name { get; set; }
    public required string Color { get; set; }
    public ProjectId ProjectId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Project? Project { get; }
    public ICollection<TestCaseLabel> TestCaseLabels { get; } = [];
}
