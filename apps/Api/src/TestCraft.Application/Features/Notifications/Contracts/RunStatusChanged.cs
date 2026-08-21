namespace TestCraft.Application.Features.Notifications.Contracts;

public record RunStatusChanged(
    TestRunId RunId,
    ProjectId ProjectId,
    string RunName,
    string NewStatus,
    string OldStatus
);
