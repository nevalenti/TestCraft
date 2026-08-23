using TestCraft.Domain.Enums;
using TestCraft.Domain.Events;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.Entities;

public class TestRun : SoftDeletableEntity
{
    public TestRunId Id { get; set; }
    public required string Name { get; set; }
    public required string Environment { get; set; }
    public TestRunStatus Status { get; private set; } = TestRunStatus.Active;
    public string? Source { get; set; }
    public UserId? ExecutedById { get; set; }
    public string? ExecutedByName { get; set; }
    public ProjectId ProjectId { get; set; }

    public Project? Project { get; set; }
    public ICollection<TestResult> TestResults { get; set; } = [];
    public ICollection<ShareToken> ShareTokens { get; set; } = [];

    public bool CanTransitionTo(TestRunStatus to) => Rank(to) >= Rank(Status);

    private static int Rank(TestRunStatus status) =>
        status switch
        {
            TestRunStatus.Active => 0,
            TestRunStatus.Completed => 1,
            TestRunStatus.Archived => 2,
            _ => throw new DomainException($"Unknown test run status: {status}"),
        };

    public bool CanAddResult() => Status != TestRunStatus.Archived;

    public void TransitionTo(TestRunStatus to)
    {
        if (!CanTransitionTo(to))
            throw new DomainException($"Cannot transition run status from {Status} to {to}");

        if (Status == to)
            return;

        var oldStatus = Status;
        Status = to;
        RaiseDomainEvent(new TestRunStatusChangedEvent(Id, ProjectId, Name, oldStatus, to));
    }

    public void EnsureCanAddResult()
    {
        if (!CanAddResult())
            throw new DomainException($"Cannot modify results in a {Status} test run");
    }
}
