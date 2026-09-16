using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class TestPlan : SoftDeletableEntity
{
    public TestPlanId Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public ProjectId ProjectId { get; private set; }

    public Project? Project { get; set; }
    public ICollection<TestPlanCase> TestPlanCases { get; set; } = [];

    public static TestPlan Create(string name, string? description, ProjectId projectId) =>
        new()
        {
            Id = TestPlanId.New(),
            Name = Guard.AgainstEmpty(name, nameof(Name)),
            Description = description,
            ProjectId = projectId,
        };

    public void Update(string name, string? description)
    {
        Name = Guard.AgainstEmpty(name, nameof(Name));
        Description = description;
    }
}
