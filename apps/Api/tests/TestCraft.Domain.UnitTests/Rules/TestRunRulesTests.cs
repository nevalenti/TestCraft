using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Domain.UnitTests.Rules;

public class TestRunRulesTests
{
    private static TestRun RunWithStatus(TestRunStatus status)
    {
        var run = new TestRun { Name = "run", Environment = "ci" };
        if (status != TestRunStatus.Active)
            run.TransitionTo(status);
        return run;
    }

    [Theory]
    [InlineData(TestRunStatus.Active, TestRunStatus.Active, true)]
    [InlineData(TestRunStatus.Active, TestRunStatus.Completed, true)]
    [InlineData(TestRunStatus.Active, TestRunStatus.Archived, true)]
    [InlineData(TestRunStatus.Completed, TestRunStatus.Active, false)]
    [InlineData(TestRunStatus.Completed, TestRunStatus.Completed, true)]
    [InlineData(TestRunStatus.Completed, TestRunStatus.Archived, true)]
    [InlineData(TestRunStatus.Archived, TestRunStatus.Active, false)]
    [InlineData(TestRunStatus.Archived, TestRunStatus.Completed, false)]
    [InlineData(TestRunStatus.Archived, TestRunStatus.Archived, true)]
    public void CanTransitionTo_OnlyAllowsForwardOrSameTransitions(
        TestRunStatus from,
        TestRunStatus to,
        bool expected
    )
    {
        RunWithStatus(from).CanTransitionTo(to).Should().Be(expected);
    }

    [Theory]
    [InlineData(TestRunStatus.Active, true)]
    [InlineData(TestRunStatus.Completed, true)]
    [InlineData(TestRunStatus.Archived, false)]
    public void CanAddResult_ReturnsFalseOnlyWhenArchived(TestRunStatus status, bool expected)
    {
        RunWithStatus(status).CanAddResult().Should().Be(expected);
    }

    [Theory]
    [InlineData(TestRunStatus.Active, TestRunStatus.Completed)]
    [InlineData(TestRunStatus.Active, TestRunStatus.Archived)]
    [InlineData(TestRunStatus.Completed, TestRunStatus.Archived)]
    [InlineData(TestRunStatus.Active, TestRunStatus.Active)]
    public void TransitionTo_ValidTransition_UpdatesStatus(TestRunStatus from, TestRunStatus to)
    {
        var run = RunWithStatus(from);
        run.TransitionTo(to);
        run.Status.Should().Be(to);
    }

    [Theory]
    [InlineData(TestRunStatus.Completed, TestRunStatus.Active)]
    [InlineData(TestRunStatus.Archived, TestRunStatus.Active)]
    [InlineData(TestRunStatus.Archived, TestRunStatus.Completed)]
    public void TransitionTo_InvalidTransition_ThrowsDomainException(
        TestRunStatus from,
        TestRunStatus to
    )
    {
        var run = RunWithStatus(from);
        var act = () => run.TransitionTo(to);
        act.Should().Throw<TestCraft.Domain.Exceptions.DomainException>();
    }

    [Theory]
    [InlineData(TestRunStatus.Active)]
    [InlineData(TestRunStatus.Completed)]
    public void EnsureCanAddResult_NonArchivedRun_DoesNotThrow(TestRunStatus status)
    {
        var run = RunWithStatus(status);
        var act = () => run.EnsureCanAddResult();
        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureCanAddResult_ArchivedRun_ThrowsDomainException()
    {
        var run = RunWithStatus(TestRunStatus.Archived);
        var act = () => run.EnsureCanAddResult();
        act.Should().Throw<TestCraft.Domain.Exceptions.DomainException>();
    }

    [Fact]
    public void CanTransitionTo_UnknownStatus_ThrowsDomainExceptionNotKeyNotFound()
    {
        var run = RunWithStatus(TestRunStatus.Active);
        var invalidStatus = (TestRunStatus)99;

        var act = () => run.CanTransitionTo(invalidStatus);

        act.Should().Throw<TestCraft.Domain.Exceptions.DomainException>();
    }
}
