using FluentAssertions;

using TestCraft.Domain.Entities;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestPlanCaseTests
{
    [Fact]
    public void Create_SetsIdsAndOrder()
    {
        var testPlanId = TestPlanId.New();
        var testCaseId = TestCaseId.New();

        var testPlanCase = TestPlanCase.Create(testPlanId, testCaseId, 3);

        testPlanCase.TestPlanId.Should().Be(testPlanId);
        testPlanCase.TestCaseId.Should().Be(testCaseId);
        testPlanCase.Order.Should().Be(3);
    }

    [Fact]
    public void Reorder_UpdatesOrder()
    {
        var testPlanCase = TestPlanCase.Create(TestPlanId.New(), TestCaseId.New(), 1);

        testPlanCase.Reorder(5);

        testPlanCase.Order.Should().Be(5);
    }
}
