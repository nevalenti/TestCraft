using TestCraft.Domain.Common;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.Entities;

/// <summary>
/// A webhook or email delivery that failed on the first attempt, kept for retry with backoff.
/// Successful first attempts are never persisted here.
/// </summary>
public class NotificationDelivery : AuditableEntity
{
    private static readonly TimeSpan[] BackoffSchedule =
    [
        TimeSpan.FromMinutes(1),
        TimeSpan.FromMinutes(5),
        TimeSpan.FromMinutes(15),
        TimeSpan.FromHours(1),
        TimeSpan.FromHours(4),
        TimeSpan.FromHours(24),
    ];

    public NotificationDeliveryId Id { get; private set; }
    public ProjectId ProjectId { get; private set; }
    public Project? Project { get; set; }
    public NotificationChannel Channel { get; private set; }
    public string EventType { get; private set; } = null!;
    public string Target { get; private set; } = null!;
    public string Payload { get; private set; } = null!;
    public string? Secret { get; private set; }
    public NotificationDeliveryStatus Status { get; private set; } =
        NotificationDeliveryStatus.Pending;
    public int AttemptCount { get; private set; }
    public DateTimeOffset NextAttemptAt { get; private set; }
    public string? LastError { get; private set; }

    public static NotificationDelivery FromFailedAttempt(
        ProjectId projectId,
        NotificationChannel channel,
        string eventType,
        string target,
        string payload,
        string? secret,
        string error
    ) =>
        new()
        {
            Id = NotificationDeliveryId.New(),
            ProjectId = projectId,
            Channel = channel,
            EventType = Guard.AgainstEmpty(eventType, nameof(EventType)),
            Target = Guard.AgainstEmpty(target, nameof(Target)),
            Payload = Guard.AgainstEmpty(payload, nameof(Payload)),
            Secret = secret,
            AttemptCount = 1,
            NextAttemptAt = DateTimeOffset.UtcNow + BackoffSchedule[0],
            LastError = Truncate(error),
        };

    public bool CanTransitionTo(NotificationDeliveryStatus to) =>
        to == Status
        || (Status, to) switch
        {
            (NotificationDeliveryStatus.Pending, NotificationDeliveryStatus.Sent) => true,
            (NotificationDeliveryStatus.Pending, NotificationDeliveryStatus.Abandoned) => true,
            _ => false,
        };

    private void TransitionTo(NotificationDeliveryStatus to)
    {
        if (!CanTransitionTo(to))
            throw new DomainException(
                $"Cannot transition notification delivery status from {Status} to {to}"
            )
            {
                ErrorCode = DomainErrorCodes.InvalidNotificationDeliveryStatusTransition,
            };

        Status = to;
    }

    public void RecordFailedAttempt(string error)
    {
        AttemptCount++;
        LastError = Truncate(error);

        TransitionTo(
            AttemptCount > BackoffSchedule.Length
                ? NotificationDeliveryStatus.Abandoned
                : NotificationDeliveryStatus.Pending
        );

        if (Status == NotificationDeliveryStatus.Pending)
            NextAttemptAt = DateTimeOffset.UtcNow + BackoffSchedule[AttemptCount - 1];
    }

    public void MarkSent() => TransitionTo(NotificationDeliveryStatus.Sent);

    private static string Truncate(string value) => value.Length <= 2000 ? value : value[..2000];
}
