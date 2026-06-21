using TestCraft.Domain.Enums;
using TestCraft.Domain.Events;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.Entities;

public class TestRun : IAuditableEntity, IHasDomainEvents
{
    private static readonly Dictionary<TestRunStatus, int> StatusOrder = new()
    {
        [TestRunStatus.Active] = 0,
        [TestRunStatus.Completed] = 1,
        [TestRunStatus.Archived] = 2,
    };

    private readonly List<IDomainEvent> _events = [];

    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Environment { get; set; }
    public TestRunStatus Status { get; private set; } = TestRunStatus.Active;
    public string? Source { get; set; }
    public Guid? ExecutedById { get; set; }
    public Guid ProjectId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public Project? Project { get; set; }
    public ICollection<TestResult> TestResults { get; set; } = [];
    public ICollection<ShareToken> ShareTokens { get; set; } = [];

    public IReadOnlyList<IDomainEvent> PopDomainEvents()
    {
        var events = _events.ToList();
        _events.Clear();
        return events;
    }

    public bool CanTransitionTo(TestRunStatus to) => StatusOrder[to] >= StatusOrder[Status];

    public bool CanAddResult() => Status != TestRunStatus.Archived;

    public void TransitionTo(TestRunStatus to)
    {
        if (!CanTransitionTo(to))
            throw new DomainException($"Cannot transition run status from {Status} to {to}");

        if (Status == to)
            return;

        var oldStatus = Status;
        Status = to;
        _events.Add(new TestRunStatusChangedEvent(Id, ProjectId, Name, oldStatus, to));
    }

    public void EnsureCanAddResult()
    {
        if (!CanAddResult())
            throw new DomainException($"Cannot modify results in a {Status} test run");
    }
}
