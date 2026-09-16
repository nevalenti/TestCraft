using FluentAssertions;

using TestCraft.Domain.Entities;

namespace TestCraft.Domain.UnitTests.Entities;

public class RunLogTests
{
    [Fact]
    public void Create_SetsFields()
    {
        var runId = TestRunId.New();

        var log = RunLog.Create(runId, "test started");

        log.RunId.Should().Be(runId);
        log.Message.Should().Be("test started");
    }

    [Fact]
    public void Create_WithEmptyMessage_DoesNotThrow()
    {
        // Blank log lines are legitimate CI output and are not rejected today.
        var act = () => RunLog.Create(TestRunId.New(), "");

        act.Should().NotThrow();
    }
}
