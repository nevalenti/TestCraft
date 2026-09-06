using TestCraft.Domain.Enums;

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

    public NotificationDeliveryId Id { get; set; }
    public ProjectId ProjectId { get; set; }
    public Project? Project { get; set; }
    public NotificationChannel Channel { get; set; }
    public required string EventType { get; set; }
    public required string Target { get; set; }
    public required string Payload { get; set; }
    public string? Secret { get; set; }
    public NotificationDeliveryStatus Status { get; set; } = NotificationDeliveryStatus.Pending;
    public int AttemptCount { get; set; }
    public DateTimeOffset NextAttemptAt { get; set; }
    public string? LastError { get; set; }

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
            EventType = eventType,
            Target = target,
            Payload = payload,
            Secret = secret,
            AttemptCount = 1,
            NextAttemptAt = DateTimeOffset.UtcNow + BackoffSchedule[0],
            LastError = Truncate(error),
        };

    public void RecordFailedAttempt(string error)
    {
        AttemptCount++;
        LastError = Truncate(error);

        Status =
            AttemptCount > BackoffSchedule.Length
                ? NotificationDeliveryStatus.Abandoned
                : NotificationDeliveryStatus.Pending;

        if (Status == NotificationDeliveryStatus.Pending)
            NextAttemptAt = DateTimeOffset.UtcNow + BackoffSchedule[AttemptCount - 1];
    }

    public void MarkSent() => Status = NotificationDeliveryStatus.Sent;

    private static string Truncate(string value) => value.Length <= 2000 ? value : value[..2000];
}
