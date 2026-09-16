using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestCaseTests
{
    [Fact]
    public void Create_WithEmptyName_ThrowsDomainException()
    {
        var act = () => TestCase.Create(TestSuiteId.New(), "");

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Update_WithEmptyName_ThrowsDomainException()
    {
        var testCase = TestCase.Create(TestSuiteId.New(), "Case");

        var act = () => testCase.Update("", null, TestCasePriority.Medium);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void DefaultPriority_IsMedium()
    {
        var testCase = TestCase.Create(TestSuiteId.New(), "Login");

        testCase.Priority.Should().Be(TestCasePriority.Medium);
    }

    [Fact]
    public void Update_SetsNameDescriptionAndPriority()
    {
        var testCase = TestCase.Create(TestSuiteId.New(), "Old Name");

        testCase.Update("New Name", "A description", TestCasePriority.High);

        testCase.Name.Should().Be("New Name");
        testCase.Description.Should().Be("A description");
        testCase.Priority.Should().Be(TestCasePriority.High);
    }

    [Fact]
    public void Update_WithNullDescription_SetsDescriptionToNull()
    {
        var testCase = TestCase.Create(TestSuiteId.New(), "Case", "old description");

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
        var testCase = TestCase.Create(TestSuiteId.New(), "Case");

        testCase.Update("Case", null, priority);

        testCase.Priority.Should().Be(priority);
    }
}
