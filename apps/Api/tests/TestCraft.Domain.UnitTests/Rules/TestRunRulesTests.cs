using FluentAssertions;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Rules;

namespace TestCraft.Domain.UnitTests.Rules;

public class TestRunRulesTests
{
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
    public void CanTransitionStatus_OnlyAllowsForwardOrSameTransitions(
        TestRunStatus from,
        TestRunStatus to,
        bool expected
    )
    {
        TestRunRules.CanTransitionStatus(from, to).Should().Be(expected);
    }

    [Theory]
    [InlineData(TestRunStatus.Active, true)]
    [InlineData(TestRunStatus.Completed, true)]
    [InlineData(TestRunStatus.Archived, false)]
    public void CanAddResultToRun_ReturnsFalseOnlyWhenArchived(TestRunStatus status, bool expected)
    {
        TestRunRules.CanAddResultToRun(status).Should().Be(expected);
    }
}
