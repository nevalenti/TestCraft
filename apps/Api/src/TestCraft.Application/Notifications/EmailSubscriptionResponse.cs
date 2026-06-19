namespace TestCraft.Application.Notifications;

public record EmailSubscriptionResponse(
    Guid Id,
    Guid ProjectId,
    string Email,
    bool IsActive,
    IReadOnlyList<string> Events,
    DateTimeOffset CreatedAt
);
