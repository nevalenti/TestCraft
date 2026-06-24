using FluentAssertions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestCaseTests
{
    [Fact]
    public void DefaultPriority_IsMedium()
    {
        var testCase = new TestCase { Name = "Login" };

        testCase.Priority.Should().Be(TestCasePriority.Medium);
    }

    [Fact]
    public void Update_SetsNameDescriptionAndPriority()
    {
        var testCase = new TestCase { Name = "Old Name" };

        testCase.Update("New Name", "A description", TestCasePriority.High);

        testCase.Name.Should().Be("New Name");
        testCase.Description.Should().Be("A description");
        testCase.Priority.Should().Be(TestCasePriority.High);
    }

    [Fact]
    public void Update_WithNullDescription_SetsDescriptionToNull()
    {
        var testCase = new TestCase { Name = "Case", Description = "old description" };

        testCase.Update("Case", null, TestCasePriority.Medium);

        testCase.Description.Should().BeNull();
    }

    [Theory]
    [InlineData(TestCasePriority.Low)]
    [InlineData(TestCasePriority.Medium)]
    [InlineData(TestCasePriority.High)]
    [InlineData(TestCasePriority.Critical)]
    public void Update_AcceptsAllPriorityValues(TestCasePriority priority)
    {
        var testCase = new TestCase { Name = "Case" };

        testCase.Update("Case", null, priority);

        testCase.Priority.Should().Be(priority);
    }
}
