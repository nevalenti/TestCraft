using TestCraft.Domain.Common;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Events;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.Entities;

public class TestRun : SoftDeletableEntity
{
    public TestRunId Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Environment { get; private set; } = null!;
    public TestRunStatus Status { get; private set; } = TestRunStatus.Active;
    public string? Source { get; private set; }
    public UserId? ExecutedById { get; private set; }
    public string? ExecutedByName { get; private set; }
    public ProjectId ProjectId { get; private set; }

    public Project? Project { get; set; }
    public ICollection<TestResult> TestResults { get; set; } = [];
    public ICollection<ShareToken> ShareTokens { get; set; } = [];

    public static TestRun Create(
        ProjectId projectId,
        string name,
        string environment,
        string? source = null,
        UserId? executedById = null,
        string? executedByName = null
    ) =>
        new()
        {
            Id = TestRunId.New(),
            ProjectId = projectId,
            Name = Guard.AgainstEmpty(name, nameof(Name)),
            Environment = Guard.AgainstEmpty(environment, nameof(Environment)),
            Source = source,
            ExecutedById = executedById,
            ExecutedByName = executedByName,
        };

    public void Update(string name, string environment)
    {
        Name = Guard.AgainstEmpty(name, nameof(Name));
        Environment = Guard.AgainstEmpty(environment, nameof(Environment));
    }

    public bool CanTransitionTo(TestRunStatus to) => Rank(to) >= Rank(Status);

    private static int Rank(TestRunStatus status) =>
        status switch
        {
            TestRunStatus.Active => 0,
            TestRunStatus.Completed => 1,
            TestRunStatus.Archived => 2,
            _ => throw new DomainException($"Unknown test run status: {status}")
            {
                ErrorCode = DomainErrorCodes.UnknownRunStatus,
            },
        };

    public bool CanAddResult() => Status != TestRunStatus.Archived;

    public void TransitionTo(TestRunStatus to)
    {
        if (!CanTransitionTo(to))
            throw new DomainException($"Cannot transition run status from {Status} to {to}")
            {
                ErrorCode = DomainErrorCodes.InvalidRunStatusTransition,
            };

        if (Status == to)
            return;

        var oldStatus = Status;
        Status = to;
        RaiseDomainEvent(new TestRunStatusChangedEvent(Id, ProjectId, Name, oldStatus, to));
    }

    public void EnsureCanAddResult()
    {
        if (!CanAddResult())
            throw new DomainException($"Cannot modify results in a {Status} test run")
            {
                ErrorCode = DomainErrorCodes.RunNotModifiable,
            };
    }
}
