namespace TestCraft.Domain.Entities;

public class TestPlanCase
{
    public Guid TestPlanId { get; set; }
    public Guid TestCaseId { get; set; }
    public int Order { get; set; }

    public TestPlan? TestPlan { get; set; }
    public TestCase? TestCase { get; set; }
}
