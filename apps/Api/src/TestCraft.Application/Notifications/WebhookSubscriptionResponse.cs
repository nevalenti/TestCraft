namespace TestCraft.Application.Notifications;

public record WebhookSubscriptionResponse(
    Guid Id,
    Guid ProjectId,
    string Url,
    bool IsActive,
    IReadOnlyList<string> Events,
    DateTimeOffset CreatedAt
);
