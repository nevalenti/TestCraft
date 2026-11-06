using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using Hangfire;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Api.Configuration.Hangfire;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Persistence;

namespace TestCraft.Api.IntegrationTests.Notifications;

[Collection(ApiCollection.Name)]
public class NotificationDispatchTests(ApiFactory factory)
{
    private static readonly string RunCompleted = NotificationEvents.Serialize([
        NotificationEvent.RunCompleted,
    ]);

    private WebApplicationFactory<Program> WithHandler(RecordingWebhookHandler handler) =>
        factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services
                    .AddHttpClient("notifications")
                    .ConfigurePrimaryHttpMessageHandler(() => handler)
            )
        );

    private async Task<ProjectId> CreateProjectAsync()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            Guid.NewGuid().ToString()
        );

        return (await client.CreateProjectAsync()).Id;
    }

    private static async Task DispatchAsync(
        WebApplicationFactory<Program> appFactory,
        ProjectId projectId
    )
    {
        using var scope = appFactory.Services.CreateScope();
        var dispatcher = scope.ServiceProvider.GetRequiredService<INotificationDispatcher>();
        await dispatcher.DispatchRunCompletedAsync(projectId, TestRunId.New(), "Nightly");
    }

    private static async Task AddWebhooksAsync(
        WebApplicationFactory<Program> appFactory,
        ProjectId projectId,
        string? secret,
        params string[] urls
    )
    {
        using var scope = appFactory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        foreach (var url in urls)
        {
            context.WebhookSubscriptions.Add(
                WebhookSubscription.Create(
                    projectId,
                    url,
                    secret,
                    RunCompleted,
                    DateTimeOffset.UtcNow
                )
            );
        }

        await context.SaveChangesAsync();
    }

    private static async Task<List<NotificationDelivery>> DeliveriesAsync(
        WebApplicationFactory<Program> appFactory,
        ProjectId projectId
    )
    {
        using var scope = appFactory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        return await context
            .NotificationDeliveries.AsNoTracking()
            .Where(delivery => delivery.ProjectId == projectId)
            .ToListAsync();
    }

    private static async Task SeedDueDeliveriesAsync(
        WebApplicationFactory<Program> appFactory,
        ProjectId projectId,
        int count
    )
    {
        using var scope = appFactory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await context.NotificationDeliveries.ExecuteDeleteAsync();
        var failedAt = DateTimeOffset.UtcNow.AddDays(-1);
        for (var i = 0; i < count; i++)
        {
            context.NotificationDeliveries.Add(
                NotificationDelivery.FromFailedAttempt(
                    projectId,
                    NotificationChannel.Webhook,
                    "run.completed",
                    $"https://hooks.example.com/{i}",
                    """{"event_type":"run.completed"}""",
                    secret: null,
                    "HTTP 500",
                    failedAt
                )
            );
        }

        await context.SaveChangesAsync();
    }

    private static async Task RetryAsync(WebApplicationFactory<Program> appFactory)
    {
        using var scope = appFactory.Services.CreateScope();
        var dispatcher = scope.ServiceProvider.GetRequiredService<INotificationDispatcher>();
        await dispatcher.RetryPendingDeliveriesAsync();
    }

    [Fact]
    public async Task Dispatch_SignsTheWebhookAndRecordsNothingWhenItSucceeds()
    {
        var handler = new RecordingWebhookHandler();
        await using var appFactory = WithHandler(handler);
        var projectId = await CreateProjectAsync();
        await AddWebhooksAsync(appFactory, projectId, "s3cret", "https://hooks.example.com/a");

        await DispatchAsync(appFactory, projectId);

        var request = handler.Requests.Should().ContainSingle().Subject;
        request.Url.Should().Be("https://hooks.example.com/a");
        request.Body.Should().Contain("\"event_type\":\"run.completed\"");
        var expectedSignature = Convert.ToHexStringLower(
            HMACSHA256.HashData(
                Encoding.UTF8.GetBytes("s3cret"),
                Encoding.UTF8.GetBytes(request.Body)
            )
        );
        request.Headers["X-Signature"].Should().Be($"sha256={expectedSignature}");
        request.Headers["X-TestCraft-Delivery-Id"].Should().MatchRegex("^[0-9a-f]{32}$");
        (await DeliveriesAsync(appFactory, projectId)).Should().BeEmpty();
    }

    [Fact]
    public async Task Dispatch_WithoutASecret_SendsNoSignature()
    {
        var handler = new RecordingWebhookHandler();
        await using var appFactory = WithHandler(handler);
        var projectId = await CreateProjectAsync();
        await AddWebhooksAsync(appFactory, projectId, null, "https://hooks.example.com/a");

        await DispatchAsync(appFactory, projectId);

        handler
            .Requests.Should()
            .ContainSingle()
            .Which.Headers.Should()
            .NotContainKey("X-Signature");
    }

    [Fact]
    public async Task Dispatch_WhenOneEndpointFails_StillSendsToTheOthersAndRecordsOnlyTheFailure()
    {
        var handler = new RecordingWebhookHandler
        {
            Respond = url =>
                url.AbsolutePath == "/bad" ? HttpStatusCode.InternalServerError : HttpStatusCode.OK,
        };
        await using var appFactory = WithHandler(handler);
        var projectId = await CreateProjectAsync();
        await AddWebhooksAsync(
            appFactory,
            projectId,
            null,
            "https://hooks.example.com/one",
            "https://hooks.example.com/bad",
            "https://hooks.example.com/two"
        );

        await DispatchAsync(appFactory, projectId);

        handler.Requests.Should().HaveCount(3);
        var delivery = (await DeliveriesAsync(appFactory, projectId))
            .Should()
            .ContainSingle()
            .Subject;
        delivery.Target.Should().Be("https://hooks.example.com/bad");
        delivery.Status.Should().Be(NotificationDeliveryStatus.Pending);
        delivery.AttemptCount.Should().Be(1);
        delivery.LastError.Should().Be("HTTP 500");
    }

    [Fact]
    public async Task Dispatch_SendsToSeveralEndpointsAtOnce()
    {
        var handler = new RecordingWebhookHandler { Delay = TimeSpan.FromMilliseconds(200) };
        await using var appFactory = WithHandler(handler);
        var projectId = await CreateProjectAsync();
        await AddWebhooksAsync(
            appFactory,
            projectId,
            null,
            "https://hooks.example.com/1",
            "https://hooks.example.com/2",
            "https://hooks.example.com/3",
            "https://hooks.example.com/4"
        );

        await DispatchAsync(appFactory, projectId);

        handler.Requests.Should().HaveCount(4);
        handler.MaxInFlight.Should().BeGreaterThan(1);
    }

    [Fact]
    public async Task Dispatch_EmailsEverySubscriber()
    {
        var handler = new RecordingWebhookHandler();
        await using var appFactory = WithHandler(handler);
        var projectId = await CreateProjectAsync();
        var first = $"{Guid.NewGuid():N}@example.com";
        var second = $"{Guid.NewGuid():N}@example.com";
        using (var scope = appFactory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            context.EmailSubscriptions.Add(
                EmailSubscription.Create(projectId, first, RunCompleted, DateTimeOffset.UtcNow)
            );
            context.EmailSubscriptions.Add(
                EmailSubscription.Create(projectId, second, RunCompleted, DateTimeOffset.UtcNow)
            );
            await context.SaveChangesAsync();
        }

        await DispatchAsync(appFactory, projectId);

        var email = appFactory.Services.GetRequiredService<FakeEmailService>();
        email.Sent.Select(sent => sent.Recipient).Should().Contain([first, second]);
    }

    [Fact]
    public async Task Retry_SendsAtMostOneBatchOfDueDeliveries()
    {
        var handler = new RecordingWebhookHandler();
        await using var appFactory = WithHandler(handler);
        var projectId = await CreateProjectAsync();
        await SeedDueDeliveriesAsync(appFactory, projectId, 101);

        await RetryAsync(appFactory);

        handler.Requests.Should().HaveCount(100);
        var deliveries = await DeliveriesAsync(appFactory, projectId);
        deliveries.Count(d => d.Status == NotificationDeliveryStatus.Sent).Should().Be(100);
        deliveries.Count(d => d.Status == NotificationDeliveryStatus.Pending).Should().Be(1);
    }

    [Fact]
    public async Task Retry_WhenTheEndpointStillFails_SchedulesTheNextAttempt()
    {
        var handler = new RecordingWebhookHandler
        {
            Respond = _ => HttpStatusCode.ServiceUnavailable,
        };
        await using var appFactory = WithHandler(handler);
        var projectId = await CreateProjectAsync();
        await SeedDueDeliveriesAsync(appFactory, projectId, 1);

        await RetryAsync(appFactory);

        var delivery = (await DeliveriesAsync(appFactory, projectId))
            .Should()
            .ContainSingle()
            .Subject;
        delivery.Status.Should().Be(NotificationDeliveryStatus.Pending);
        delivery.AttemptCount.Should().Be(2);
        delivery.LastError.Should().Be("HTTP 503");
        delivery.NextAttemptAt.Should().BeAfter(DateTimeOffset.UtcNow);
    }

    [Fact]
    public void RetryJob_RunsOneAtATime() =>
        typeof(SingleRunNotificationDeliveryRetryJob)
            .GetMethod(nameof(SingleRunNotificationDeliveryRetryJob.RunAsync))
            .Should()
            .BeDecoratedWith<DisableConcurrentExecutionAttribute>();
}
