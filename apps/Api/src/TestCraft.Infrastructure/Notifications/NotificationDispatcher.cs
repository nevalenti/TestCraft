using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Infrastructure.Notifications;

public partial class NotificationDispatcher(
    IApplicationDbContext context,
    IEmailService email,
    IHttpClientFactory httpClientFactory,
    ILogger<NotificationDispatcher> logger
) : INotificationDispatcher
{
    public async Task DispatchRunCompletedAsync(
        Guid projectId,
        Guid runId,
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
    }

    private async Task DispatchWebhooksAsync(
        Guid projectId,
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
        var http = httpClientFactory.CreateClient("notifications");

        foreach (var webhook in webhooks)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, webhook.Url)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json"),
                };

                if (!string.IsNullOrEmpty(webhook.Secret))
                {
                    var sig = ComputeHmac(webhook.Secret, json);
                    request.Headers.Add("X-Signature", $"sha256={sig}");
                }

                using var response = await http.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                    LogWebhookFailed(
                        logger,
                        webhook.Url,
                        (int)response.StatusCode,
                        projectId,
                        eventType
                    );
            }
            catch (Exception ex)
            {
                LogWebhookException(logger, webhook.Url, projectId, eventType, ex);
            }
        }
    }

    private async Task DispatchEmailsAsync(
        Guid projectId,
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

        foreach (var recipient in recipients)
        {
            try
            {
                await email.SendAsync(
                    recipient,
                    subject: $"[TestCraft] {runName} — {eventType}",
                    htmlBody: body,
                    cancellationToken: cancellationToken
                );
            }
            catch (Exception ex)
            {
                LogEmailException(logger, recipient, projectId, eventType, ex);
            }
        }
    }

    private static string ComputeHmac(string secret, string payload)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var msgBytes = Encoding.UTF8.GetBytes(payload);
        var hashBytes = HMACSHA256.HashData(keyBytes, msgBytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Webhook {Url} returned HTTP {StatusCode} for project {ProjectId} event {EventType}"
    )]
    static partial void LogWebhookFailed(
        ILogger logger,
        string url,
        int statusCode,
        Guid projectId,
        string eventType
    );

    [LoggerMessage(
        Level = LogLevel.Error,
        Message = "Webhook delivery failed for {Url} (project {ProjectId}, event {EventType})"
    )]
    static partial void LogWebhookException(
        ILogger logger,
        string url,
        Guid projectId,
        string eventType,
        Exception ex
    );

    [LoggerMessage(
        Level = LogLevel.Error,
        Message = "Email delivery failed for {Recipient} (project {ProjectId}, event {EventType})"
    )]
    static partial void LogEmailException(
        ILogger logger,
        string recipient,
        Guid projectId,
        string eventType,
        Exception ex
    );
}
