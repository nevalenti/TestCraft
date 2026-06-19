namespace TestCraft.Application.Notifications.Contracts;

public record RunStatusChanged(
    Guid RunId,
    Guid ProjectId,
    string RunName,
    string NewStatus,
    string OldStatus
);
