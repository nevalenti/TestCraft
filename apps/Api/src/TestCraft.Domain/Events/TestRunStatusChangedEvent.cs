using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Events;

public sealed record TestRunStatusChangedEvent(
    Guid RunId,
    Guid ProjectId,
    string RunName,
    TestRunStatus OldStatus,
    TestRunStatus NewStatus
) : IDomainEvent;
