using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Notifications;

internal sealed partial class NotificationDispatcher(
    IApplicationDbContext context,
    IEmailService email,
    WebhookSender webhookSender,
    IOptions<InfrastructureOptions> options,
    ILogger<NotificationDispatcher> logger,
    TimeProvider timeProvider
) : INotificationDispatcher
{
    private const int RetryBatchSize = 100;
    private const int MaxParallelDeliveries = 8;

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
            event_id = Guid.NewGuid(),
            event_type = "run.completed",
            run_id = runId,
            run_name = runName,
            project_id = projectId,
        };
        await DispatchWebhooksAsync(projectId, "run.completed", payload, cancellationToken);
        var runUrl = $"{options.Value.WebBaseUrl.TrimEnd('/')}/projects/{projectId}/runs/{runId}";
        await DispatchEmailsAsync(
            projectId,
            "run.completed",
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
            .OrderBy(delivery => delivery.NextAttemptAt)
            .Take(RetryBatchSize)
            .ToListAsync(cancellationToken);

        if (due.Count == 0)
        {
            return;
        }

        var results = await SendAllAsync(due, TrySendAsync, cancellationToken);

        for (var i = 0; i < due.Count; i++)
        {
            var delivery = due[i];
            var result = results[i];
            var target = RedactTarget(delivery.Channel, delivery.Target);

            if (result.Success)
            {
                delivery.MarkSent();
                LogDeliveryRetrySucceeded(logger, delivery.Channel, target, delivery.AttemptCount);
                continue;
            }

            delivery.RecordFailedAttempt(result.Error!, timeProvider.GetStoredUtcNow());
            if (delivery.Status == NotificationDeliveryStatus.Abandoned)
            {
                NotificationMetrics.RecordAbandoned(delivery.Channel);
                LogDeliveryAbandoned(
                    logger,
                    result.Exception,
                    delivery.Channel,
                    target,
                    delivery.AttemptCount
                );
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private Task<DeliveryAttemptResult> TrySendAsync(
        NotificationDelivery delivery,
        CancellationToken cancellationToken
    ) =>
        delivery.Channel == NotificationChannel.Webhook
            ? webhookSender.SendAsync(
                delivery.Target,
                delivery.Secret,
                delivery.Payload,
                cancellationToken
            )
            : TrySendEmailAsync(delivery, cancellationToken);

    private static async Task<DeliveryAttemptResult[]> SendAllAsync<T>(
        IReadOnlyList<T> items,
        Func<T, CancellationToken, Task<DeliveryAttemptResult>> send,
        CancellationToken cancellationToken
    )
    {
        var results = new DeliveryAttemptResult[items.Count];
        await Parallel.ForEachAsync(
            Enumerable.Range(0, items.Count),
            new ParallelOptions
            {
                MaxDegreeOfParallelism = MaxParallelDeliveries,
                CancellationToken = cancellationToken,
            },
            async (index, token) => results[index] = await send(items[index], token)
        );

        return results;
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
        var results = await SendAllAsync(
            webhooks,
            (webhook, token) => webhookSender.SendAsync(webhook.Url, webhook.Secret, json, token),
            cancellationToken
        );

        for (var i = 0; i < webhooks.Count; i++)
        {
            var webhook = webhooks[i];
            var result = results[i];
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
        string eventType,
        string subject,
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

        var results = await SendAllAsync(
            recipients,
            (recipient, token) => TrySendEmailAsync(recipient, subject, body, token),
            cancellationToken
        );

        for (var i = 0; i < recipients.Count; i++)
        {
            var recipient = recipients[i];
            var result = results[i];
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
}