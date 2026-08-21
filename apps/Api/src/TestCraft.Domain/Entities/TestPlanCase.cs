namespace TestCraft.Domain.Entities;

public class TestPlanCase
{
    public TestPlanId TestPlanId { get; set; }
    public TestCaseId TestCaseId { get; set; }
    public int Order { get; set; }

    public TestPlan? TestPlan { get; set; }
    public TestCase? TestCase { get; set; }
}
