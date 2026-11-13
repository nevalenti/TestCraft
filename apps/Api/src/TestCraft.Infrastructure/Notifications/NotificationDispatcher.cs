using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Notifications;

public partial class NotificationDispatcher(
    IApplicationDbContext context,
    IEmailService email,
    IHttpClientFactory httpClientFactory,
    IOptions<InfrastructureOptions> options,
    ILogger<NotificationDispatcher> logger,
    TimeProvider timeProvider
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

    private sealed record RunCompletedPayload(
        [property: JsonPropertyName("event_id")] Guid EventId,
        [property: JsonPropertyName("event_type")] string EventType,
        [property: JsonPropertyName("run_id")] TestRunId RunId,
        [property: JsonPropertyName("run_name")] string RunName,
        [property: JsonPropertyName("project_id")] ProjectId ProjectId
    );

    public async Task DispatchRunCompletedAsync(
        ProjectId projectId,
        TestRunId runId,
        string runName,
        CancellationToken cancellationToken = default
    )
    {
        const NotificationEvent notificationEvent = NotificationEvent.RunCompleted;
        var payload = new RunCompletedPayload(
            Guid.NewGuid(),
            NotificationEvents.WireName(notificationEvent),
            runId,
            runName,
            projectId
        );
        await DispatchWebhooksAsync(projectId, notificationEvent, payload, cancellationToken);
        var runUrl = $"{options.Value.WebBaseUrl.TrimEnd('/')}/projects/{projectId}/runs/{runId}";
        await DispatchEmailsAsync(
            projectId,
            notificationEvent,
            RunCompletedEmail.Subject(runName),
            RunCompletedEmail.Body(runName, runUrl),
            cancellationToken
        );

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RetryPendingDeliveriesAsync(CancellationToken cancellationToken = default)
    {
        if (!options.Value.NotificationDeliveryRetryEnabled)
        {
            LogRetryDisabled(logger);
            return;
        }

        var due = await context
            .NotificationDeliveries.Where(delivery =>
                delivery.Status == NotificationDeliveryStatus.Pending
                && delivery.NextAttemptAt <= timeProvider.GetUtcNow()
            )
            .ToListAsync(cancellationToken);

        if (due.Count == 0)
        {
            return;
        }

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
                    : await TrySendQueuedEmailAsync(delivery, cancellationToken);

            if (result.Success)
            {
                delivery.MarkSent();
#pragma warning disable CA1873
                LogDeliveryRetrySucceeded(
                    logger,
                    delivery.Channel,
                    RedactTarget(delivery.Channel, delivery.Target),
                    delivery.AttemptCount
                );
#pragma warning restore CA1873
            }
            else
            {
                delivery.RecordFailedAttempt(result.Error!, timeProvider.GetStoredUtcNow());
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
        NotificationEvent notificationEvent,
        object payload,
        CancellationToken cancellationToken
    )
    {
        var eventType = NotificationEvents.WireName(notificationEvent);
        var eventToken = NotificationEvents.StoredToken(notificationEvent);
        var webhooks = await context
            .WebhookSubscriptions.AsNoTracking()
            .Where(webhookSubscription =>
                webhookSubscription.ProjectId == projectId
                && webhookSubscription.IsActive
                && webhookSubscription.Events.Contains(eventToken)
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
            {
                continue;
            }

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
                    result.Error!,
                    timeProvider.GetStoredUtcNow()
                )
            );
        }
    }

    private async Task DispatchEmailsAsync(
        ProjectId projectId,
        NotificationEvent notificationEvent,
        string subject,
        string body,
        CancellationToken cancellationToken
    )
    {
        var eventType = NotificationEvents.WireName(notificationEvent);
        var eventToken = NotificationEvents.StoredToken(notificationEvent);
        var recipients = await context
            .EmailSubscriptions.Where(emailSubscription =>
                emailSubscription.ProjectId == projectId
                && emailSubscription.IsActive
                && emailSubscription.Events.Contains(eventToken)
            )
            .Select(emailSubscription => emailSubscription.Email)
            .ToListAsync(cancellationToken);

        foreach (var recipient in recipients)
        {
            var result = await TrySendEmailAsync(recipient, subject, body, cancellationToken);
            if (result.Success)
            {
                continue;
            }

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
                    result.Error!,
                    timeProvider.GetStoredUtcNow()
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
            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json"),
            };
            request.Headers.Add("X-TestCraft-Delivery-Id", DeliveryId(url, json));

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
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            return DeliveryAttemptResult.Fail("webhook timeout", ex);
        }
        catch (HttpRequestException ex) when (ex.InnerException is InvalidOperationException)
        {
            return DeliveryAttemptResult.Fail("webhook address resolution failed", ex);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return DeliveryAttemptResult.Fail("webhook transport failed", ex);
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
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return DeliveryAttemptResult.Fail("email delivery failed", ex);
        }
    }

    private async Task<DeliveryAttemptResult> TrySendQueuedEmailAsync(
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

    private static string DeliveryId(string url, string json) =>
        Convert
            .ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{url}\n{json}")))
            .ToLowerInvariant()[..32];

    private static string ComputeHmac(string secret, string payload)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var msgBytes = Encoding.UTF8.GetBytes(payload);
        var hashBytes = HMACSHA256.HashData(keyBytes, msgBytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
