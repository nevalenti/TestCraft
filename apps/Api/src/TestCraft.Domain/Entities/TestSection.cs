using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class TestSection : SoftDeletableEntity, IVersioned
{
    public TestSectionId Id { get; private set; }
    public int Version { get; private set; } = 1;
    public TestSuiteId SuiteId { get; private set; }
    public TestSectionId? ParentId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public int Position { get; private set; }

    public TestSuite? Suite { get; }
    public ICollection<TestCase> TestCases { get; } = [];

    public static TestSection Create(
        TestSuiteId suiteId,
        TestSectionId? parentId,
        string name,
        string? description,
        int position
    ) =>
        new()
        {
            Id = TestSectionId.New(),
            SuiteId = suiteId,
            ParentId = parentId,
            Name = Guard.AgainstEmpty(name, nameof(Name)),
            Description = description,
            Position = position,
        };

    public void Update(string name, string? description)
    {
        Name = Guard.AgainstEmpty(name, nameof(Name));
        Description = description;
    }

    public void MoveTo(TestSectionId? parentId, int position)
    {
        ParentId = parentId;
        Position = position;
    }

    public void Reorder(int position) => Position = position;
}
