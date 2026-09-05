using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Infrastructure.FeatureToggles;

namespace TestCraft.Infrastructure.Notifications;

#pragma warning disable CA1873
public partial class NotificationDispatcher(
    IApplicationDbContext context,
    IEmailService email,
    IHttpClientFactory httpClientFactory,
    [FromKeyedServices(FeatureToggleNames.NotificationDeliveryRetry)] IFeatureToggle retryToggle,
    ILogger<NotificationDispatcher> logger
) : INotificationDispatcher
{
    private readonly record struct DeliveryAttemptResult(
        bool Success,
        string? Error,
        Exception? Exception = null
    )
    {
        public static readonly DeliveryAttemptResult Ok = new(true, null);

        public static DeliveryAttemptResult Fail(string error, Exception? exception = null) =>
            new(false, error, exception);
    }

    private sealed record EmailPayload(string Subject, string HtmlBody);

    public async Task DispatchRunCompletedAsync(
        ProjectId projectId,
        TestRunId runId,
        string runName,
        CancellationToken cancellationToken = default
    )
    {
        var payload = new
        {
            event_type = "run.completed",
            run_id = runId,
            run_name = runName,
            project_id = projectId,
        };
        await DispatchWebhooksAsync(projectId, "run.completed", payload, cancellationToken);
        await DispatchEmailsAsync(
            projectId,
            "run.completed",
            runName,
            $"Test run <b>{runName}</b> has completed.",
            cancellationToken
        );

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RetryPendingDeliveriesAsync(CancellationToken cancellationToken = default)
    {
        if (!retryToggle.IsEnabled)
        {
            LogRetryDisabled(logger);
            return;
        }

        var due = await context
            .NotificationDeliveries.Where(delivery =>
                delivery.Status == NotificationDeliveryStatus.Pending
                && delivery.NextAttemptAt <= DateTimeOffset.UtcNow
            )
            .ToListAsync(cancellationToken);

        if (due.Count == 0)
            return;

        foreach (var delivery in due)
        {
            var result =
                delivery.Channel == NotificationChannel.Webhook
                    ? await TrySendWebhookAsync(
                        delivery.Target,
                        delivery.Secret,
                        delivery.Payload,
                        cancellationToken
                    )
                    : await TrySendEmailAsync(delivery, cancellationToken);

            if (result.Success)
            {
                delivery.MarkSent();
                LogDeliveryRetrySucceeded(
                    logger,
                    delivery.Channel,
                    RedactTarget(delivery.Channel, delivery.Target),
                    delivery.AttemptCount
                );
            }
            else
            {
                delivery.RecordFailedAttempt(result.Error!);
                if (delivery.Status == NotificationDeliveryStatus.Abandoned)
                {
                    NotificationMetrics.RecordAbandoned(delivery.Channel);
                    LogDeliveryAbandoned(
                        logger,
                        result.Exception,
                        delivery.Channel,
                        RedactTarget(delivery.Channel, delivery.Target),
                        delivery.AttemptCount
                    );
                }
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task DispatchWebhooksAsync(
        ProjectId projectId,
        string eventType,
        object payload,
        CancellationToken cancellationToken
    )
    {
        var webhooks = await context
            .WebhookSubscriptions.AsNoTracking()
            .Where(webhookSubscription =>
                webhookSubscription.ProjectId == projectId
                && webhookSubscription.IsActive
                && webhookSubscription.Events.Contains($"\"{eventType}\"")
            )
            .ToListAsync(cancellationToken);

        var json = JsonSerializer.Serialize(payload);

        foreach (var webhook in webhooks)
        {
            var result = await TrySendWebhookAsync(
                webhook.Url,
                webhook.Secret,
                json,
                cancellationToken
            );

            if (result.Success)
                continue;

            LogWebhookFailed(
                logger,
                result.Exception,
                RedactWebhookUrl(webhook.Url),
                projectId,
                eventType,
                result.Error!
            );
            context.NotificationDeliveries.Add(
                NotificationDelivery.FromFailedAttempt(
                    projectId,
                    NotificationChannel.Webhook,
                    eventType,
                    webhook.Url,
                    json,
                    webhook.Secret,
                    result.Error!
                )
            );
        }
    }

    private async Task DispatchEmailsAsync(
        ProjectId projectId,
        string eventType,
        string runName,
        string body,
        CancellationToken cancellationToken
    )
    {
        var recipients = await context
            .EmailSubscriptions.Where(emailSubscription =>
                emailSubscription.ProjectId == projectId
                && emailSubscription.IsActive
                && emailSubscription.Events.Contains($"\"{eventType}\"")
            )
            .Select(emailSubscription => emailSubscription.Email)
            .ToListAsync(cancellationToken);

        var subject = $"[TestCraft] {runName} — {eventType}";

        foreach (var recipient in recipients)
        {
            var result = await TrySendEmailAsync(recipient, subject, body, cancellationToken);
            if (result.Success)
                continue;

            LogEmailFailed(
                logger,
                result.Exception,
                MaskEmail(recipient),
                projectId,
                eventType,
                result.Error!
            );
            context.NotificationDeliveries.Add(
                NotificationDelivery.FromFailedAttempt(
                    projectId,
                    NotificationChannel.Email,
                    eventType,
                    recipient,
                    JsonSerializer.Serialize(new EmailPayload(subject, body)),
                    secret: null,
                    result.Error!
                )
            );
        }
    }

    private async Task<DeliveryAttemptResult> TrySendWebhookAsync(
        string url,
        string? secret,
        string json,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var http = httpClientFactory.CreateClient("notifications");
            var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json"),
            };

            if (!string.IsNullOrEmpty(secret))
            {
                var sig = ComputeHmac(secret, json);
                request.Headers.Add("X-Signature", $"sha256={sig}");
            }

            using var response = await http.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode
                ? DeliveryAttemptResult.Ok
                : DeliveryAttemptResult.Fail($"HTTP {(int)response.StatusCode}");
        }
        catch (Exception ex)
        {
            return DeliveryAttemptResult.Fail(ex.Message, ex);
        }
    }

    private async Task<DeliveryAttemptResult> TrySendEmailAsync(
        string recipient,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken
    )
    {
        try
        {
            await email.SendAsync(recipient, subject, htmlBody, cancellationToken);
            return DeliveryAttemptResult.Ok;
        }
        catch (Exception ex)
        {
            return DeliveryAttemptResult.Fail(ex.Message, ex);
        }
    }

    private async Task<DeliveryAttemptResult> TrySendEmailAsync(
        NotificationDelivery delivery,
        CancellationToken cancellationToken
    )
    {
        var payload = JsonSerializer.Deserialize<EmailPayload>(delivery.Payload)!;
        return await TrySendEmailAsync(
            delivery.Target,
            payload.Subject,
            payload.HtmlBody,
            cancellationToken
        );
    }

    private static string ComputeHmac(string secret, string payload)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var msgBytes = Encoding.UTF8.GetBytes(payload);
        var hashBytes = HMACSHA256.HashData(keyBytes, msgBytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
#pragma warning restore CA1873
