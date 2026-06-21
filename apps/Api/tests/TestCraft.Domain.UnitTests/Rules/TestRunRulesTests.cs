using FluentAssertions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Domain.UnitTests.Rules;

public class TestRunRulesTests
{
    private static TestRun RunWithStatus(TestRunStatus status) =>
        new()
        {
            Name = "run",
            Environment = "ci",
            Status = status,
        };

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
}
