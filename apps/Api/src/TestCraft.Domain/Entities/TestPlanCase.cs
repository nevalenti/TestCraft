namespace TestCraft.Domain.Entities;

public class TestPlanCase
{
    public TestPlanId TestPlanId { get; private set; }
    public TestCaseId TestCaseId { get; private set; }
    public int Order { get; private set; }

    public TestPlan? TestPlan { get; }
    public TestCase? TestCase { get; }

    public static TestPlanCase Create(TestPlanId testPlanId, TestCaseId testCaseId, int order) =>
        new()
        {
            TestPlanId = testPlanId,
            TestCaseId = testCaseId,
            Order = order,
        };

    public void Reorder(int order) => Order = order;
}
