using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class TestCaseStepTests
{
    [Fact]
    public void Create_WithEmptyAction_ThrowsDomainException()
    {
        var act = () => TestCaseStep.Create(TestCaseId.New(), 1, "", "Expected result");

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Create_WithEmptyExpectedResult_ThrowsDomainException()
    {
        var act = () => TestCaseStep.Create(TestCaseId.New(), 1, "Do something", "");

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Create_SetsFields()
    {
        var testCaseId = TestCaseId.New();

        var step = TestCaseStep.Create(testCaseId, 2, "Click submit", "Form is submitted");

        step.TestCaseId.Should().Be(testCaseId);
        step.Order.Should().Be(2);
        step.Action.Should().Be("Click submit");
        step.ExpectedResult.Should().Be("Form is submitted");
    }

    [Fact]
    public void Update_WithEmptyAction_ThrowsDomainException()
    {
        var step = TestCaseStep.Create(TestCaseId.New(), 1, "Action", "Expected");

        var act = () => step.Update(1, "", "Expected");

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Update_SetsFields()
    {
        var step = TestCaseStep.Create(TestCaseId.New(), 1, "Old action", "Old expected");

        step.Update(3, "New action", "New expected");

        step.Order.Should().Be(3);
        step.Action.Should().Be("New action");
        step.ExpectedResult.Should().Be("New expected");
    }

    [Fact]
    public void Reorder_UpdatesOrderOnly()
    {
        var step = TestCaseStep.Create(TestCaseId.New(), 1, "Action", "Expected");

        step.Reorder(9);

        step.Order.Should().Be(9);
        step.Action.Should().Be("Action");
    }
}
