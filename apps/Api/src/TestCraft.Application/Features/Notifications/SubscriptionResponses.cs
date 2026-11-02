using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Notifications;

/// <summary>A webhook subscription that POSTs to a URL when project events occur.</summary>
public record WebhookSubscriptionResponse
{
    public static WebhookSubscriptionResponse FromEntity(WebhookSubscription subscription) =>
        new()
        {
            Id = subscription.Id,
            Version = subscription.Version,
            ProjectId = subscription.ProjectId,
            Url = subscription.Url,
            HasSecret = subscription.Secret is not null,
            IsActive = subscription.IsActive,
            Events = NotificationEvents.Parse(subscription.Events),
            CreatedAt = subscription.CreatedAt,
        };

    /// <summary>The subscription's identifier.</summary>
    public required WebhookSubscriptionId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>The project the subscription belongs to.</summary>
    public required ProjectId ProjectId { get; init; }

    /// <summary>The URL event payloads are POSTed to.</summary>
    public required string Url { get; init; }

    /// <summary>Whether payloads are signed with a secret; the secret itself is never returned.</summary>
    public required bool HasSecret { get; init; }

    /// <summary>Whether the subscription is currently active.</summary>
    public required bool IsActive { get; init; }

    /// <summary>The events the subscription notifies on.</summary>
    public required IReadOnlyList<NotificationEvent> Events { get; init; }

    /// <summary>When the subscription was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}

/// <summary>An email subscription that notifies an address when project events occur.</summary>
public record EmailSubscriptionResponse
{
    public static EmailSubscriptionResponse FromEntity(EmailSubscription subscription) =>
        new()
        {
            Id = subscription.Id,
            Version = subscription.Version,
            ProjectId = subscription.ProjectId,
            Email = subscription.Email,
            IsActive = subscription.IsActive,
            Events = NotificationEvents.Parse(subscription.Events),
            CreatedAt = subscription.CreatedAt,
        };

    /// <summary>The subscription's identifier.</summary>
    public required EmailSubscriptionId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>The project the subscription belongs to.</summary>
    public required ProjectId ProjectId { get; init; }

    /// <summary>The email address being notified.</summary>
    public required string Email { get; init; }

    /// <summary>Whether the subscription is currently active.</summary>
    public required bool IsActive { get; init; }

    /// <summary>The events the subscription notifies on.</summary>
    public required IReadOnlyList<NotificationEvent> Events { get; init; }

    /// <summary>When the subscription was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}
