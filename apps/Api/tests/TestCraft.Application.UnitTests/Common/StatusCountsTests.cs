using FluentAssertions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.UnitTests.Common;

public class StatusCountsTests
{
    [Fact]
    public void From_MissingStatusesCountAsZero()
    {
        var counts = StatusCounts.From(
            new Dictionary<TestResultStatus, int> { [TestResultStatus.Passed] = 2 }
        );

        counts.Should().Be(new StatusCounts(2, 0, 0, 0, 0));
    }

    [Fact]
    public void Executed_ExcludesUntested_AndTotalIncludesIt()
    {
        var counts = new StatusCounts(Passed: 1, Failed: 2, Blocked: 3, Skipped: 4, Untested: 5);

        counts.Executed.Should().Be(10);
        counts.Total.Should().Be(15);
    }

    [Fact]
    public void PassRate_IsNullWhenNothingExecuted()
    {
        new StatusCounts(0, 0, 0, 0, 3).PassRate.Should().BeNull();
    }

    [Theory]
    [InlineData(1, 2, 33.3)]
    [InlineData(2, 1, 66.7)]
    [InlineData(1, 0, 100)]
    [InlineData(0, 4, 0)]
    public void PassRate_IsPassedShareOfExecutedRoundedToOneDecimal(
        int passed,
        int failed,
        double expected
    )
    {
        new StatusCounts(passed, failed, 0, 0, 0).PassRate.Should().Be(expected);
    }
}
