using Microsoft.Extensions.Logging;

using TestCraft.Domain.Enums;

namespace TestCraft.Infrastructure.Notifications;

public partial class NotificationDispatcher
{
    private static string RedactWebhookUrl(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri)
            ? $"{uri.Scheme}://{uri.Host}/***"
            : "***";

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        return at <= 1 ? "***" : $"{email[0]}***{email[at..]}";
    }

    private static string RedactTarget(NotificationChannel channel, string target) =>
        channel == NotificationChannel.Webhook ? RedactWebhookUrl(target) : MaskEmail(target);

    [LoggerMessage(
        Level = LogLevel.Debug,
        Message = "Notification delivery retry is disabled via configuration, skipping this run"
    )]
    private static partial void LogRetryDisabled(ILogger logger);

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Webhook {Url} failed for project {ProjectId} event {EventType}, queued for retry: {Error}"
    )]
    private static partial void LogWebhookFailed(
        ILogger logger,
        Exception? exception,
        string url,
        ProjectId projectId,
        string eventType,
        string error
    );

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Email to {Recipient} failed for project {ProjectId} event {EventType}, queued for retry: {Error}"
    )]
    private static partial void LogEmailFailed(
        ILogger logger,
        Exception? exception,
        string recipient,
        ProjectId projectId,
        string eventType,
        string error
    );

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "{Channel} delivery to {Target} succeeded on retry after {AttemptCount} attempt(s)"
    )]
    private static partial void LogDeliveryRetrySucceeded(
        ILogger logger,
        NotificationChannel channel,
        string target,
        int attemptCount
    );

    [LoggerMessage(
        Level = LogLevel.Error,
        Message = "{Channel} delivery to {Target} abandoned after {AttemptCount} attempts"
    )]
    private static partial void LogDeliveryAbandoned(
        ILogger logger,
        Exception? exception,
        NotificationChannel channel,
        string target,
        int attemptCount
    );
}
