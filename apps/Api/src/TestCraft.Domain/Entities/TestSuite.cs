using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class TestSuite : SoftDeletableEntity
{
    public TestSuiteId Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public string? Source { get; private set; }
    public ProjectId ProjectId { get; private set; }

    public Project? Project { get; set; }
    public ICollection<TestCase> TestCases { get; set; } = [];

    public static TestSuite Create(
        ProjectId projectId,
        string name,
        string? description = null,
        string? source = null
    ) =>
        new()
        {
            Id = TestSuiteId.New(),
            ProjectId = projectId,
            Name = Guard.AgainstEmpty(name, nameof(Name)),
            Description = description,
            Source = source,
        };

    public void Update(string name, string? description)
    {
        Name = Guard.AgainstEmpty(name, nameof(Name));
        Description = description;
    }

    /// <summary>Sets the suite's source if it doesn't already have one, e.g. when an import discovers it.</summary>
    public void BackfillSource(string source)
    {
        if (string.IsNullOrEmpty(Source))
            Source = source;
    }
}
