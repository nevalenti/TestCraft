namespace TestCraft.Domain.Entities;

public class TestPlan : SoftDeletableEntity
{
    public TestPlanId Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public ProjectId ProjectId { get; set; }

    public Project? Project { get; set; }
    public ICollection<TestPlanCase> TestPlanCases { get; set; } = [];
}
