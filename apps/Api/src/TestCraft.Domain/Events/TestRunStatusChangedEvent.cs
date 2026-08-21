using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Events;

public sealed record TestRunStatusChangedEvent(
    TestRunId RunId,
    ProjectId ProjectId,
    string RunName,
    TestRunStatus OldStatus,
    TestRunStatus NewStatus
) : IDomainEvent;
