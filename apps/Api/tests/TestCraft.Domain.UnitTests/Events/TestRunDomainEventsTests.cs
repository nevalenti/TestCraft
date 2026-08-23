using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Events;

namespace TestCraft.Domain.UnitTests.Events;

public class TestRunDomainEventsTests
{
    private static TestRun MakeRun(TestRunStatus startingStatus = TestRunStatus.Active)
    {
        var run = new TestRun
        {
            Id = TestRunId.New(),
            ProjectId = ProjectId.New(),
            Name = "Smoke Run",
            Environment = "ci",
        };

        if (startingStatus != TestRunStatus.Active)
        {
            run.TransitionTo(startingStatus);
        }

        run.PopDomainEvents();
        return run;
    }

    [Fact]
    public void TransitionTo_ValidTransition_RaisesOneStatusChangedEvent()
    {
        var run = MakeRun();

        run.TransitionTo(TestRunStatus.Completed);

        run.PopDomainEvents()
            .Should()
            .ContainSingle()
            .Which.Should()
            .BeOfType<TestRunStatusChangedEvent>();
    }

    [Fact]
    public void TransitionTo_RaisedEvent_ContainsCorrectRunId()
    {
        var run = MakeRun();
        run.TransitionTo(TestRunStatus.Completed);

        var evt = run.PopDomainEvents().OfType<TestRunStatusChangedEvent>().Single();

        evt.RunId.Should().Be(run.Id);
    }

    [Fact]
    public void TransitionTo_RaisedEvent_ContainsCorrectProjectId()
    {
        var run = MakeRun();
        run.TransitionTo(TestRunStatus.Completed);

        var evt = run.PopDomainEvents().OfType<TestRunStatusChangedEvent>().Single();

        evt.ProjectId.Should().Be(run.ProjectId);
    }

    [Fact]
    public void TransitionTo_RaisedEvent_ContainsCorrectRunName()
    {
        var run = MakeRun();
        run.TransitionTo(TestRunStatus.Completed);

        var evt = run.PopDomainEvents().OfType<TestRunStatusChangedEvent>().Single();

        evt.RunName.Should().Be("Smoke Run");
    }

    [Theory]
    [InlineData(TestRunStatus.Active, TestRunStatus.Completed)]
    [InlineData(TestRunStatus.Active, TestRunStatus.Archived)]
    [InlineData(TestRunStatus.Completed, TestRunStatus.Archived)]
    public void TransitionTo_RaisedEvent_HasCorrectOldAndNewStatus(
        TestRunStatus from,
        TestRunStatus to
    )
    {
        var run = MakeRun(from);

        run.TransitionTo(to);

        var evt = run.PopDomainEvents().OfType<TestRunStatusChangedEvent>().Single();
        evt.OldStatus.Should().Be(from);
        evt.NewStatus.Should().Be(to);
    }

    [Fact]
    public void TransitionTo_SameStatus_DoesNotRaiseEvent()
    {
        var run = MakeRun();

        run.TransitionTo(TestRunStatus.Active);

        run.PopDomainEvents().Should().BeEmpty();
    }

    [Fact]
    public void PopDomainEvents_AfterTransition_ClearsEventList()
    {
        var run = MakeRun();
        run.TransitionTo(TestRunStatus.Completed);

        run.PopDomainEvents().Should().HaveCount(1);

        run.PopDomainEvents().Should().BeEmpty();
    }
}
