using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.Extensions.Options;
using TestCraft.Api.Idempotency;
using TestCraft.Application.Features.Notifications;
using TestCraft.Application.Features.ShareTokens;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Common.Security;
using TestCraft.Infrastructure.Configuration;
using TestCraft.Persistence;

namespace TestCraft.Api.Configuration.Hangfire;

public static class HangfireExtensions
{
    public static WebApplicationBuilder AddHangfireJobs(
        this WebApplicationBuilder builder,
        InfrastructureOptions infrastructureOptions
    )
    {
        builder.Services.AddStartupOptions<HangfireBasicAuthOptions>(builder.Configuration);

        var connectionString = ConnectionStringHelpers.ToNpgsqlConnectionString(
            infrastructureOptions.DatabaseUrl
        );

        builder.Services.AddHangfire(config =>
            config
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connectionString))
        );

        builder.Services.AddHangfireServer();

        builder.Services.AddScoped<ExpiredShareTokenCleanupJob>();
        builder.Services.AddScoped<NotificationDeliveryRetryJob>();
        builder.Services.AddScoped<NotificationDeliveryCleanupJob>();
        builder.Services.AddScoped<StaleTestRunCleanupJob>();
        builder.Services.AddScoped<IdempotencyCleanupJob>();

        GlobalJobFilters.Filters.Add(new HangfireMetricsFilter());

        return builder;
    }

    public static WebApplication UseHangfireJobs(this WebApplication app)
    {
        var hangfireBasicAuthOptions = app
            .Services.GetRequiredService<IOptions<HangfireBasicAuthOptions>>()
            .Value;
        var dashboardOptions = new DashboardOptions
        {
            Authorization =
            [
                new HangfireDashboardAuthorizationFilter(hangfireBasicAuthOptions, app.Environment),
            ],
        };

        if (!app.Environment.IsDevelopment())
        {
            app.UseWhen(
                context => context.Request.Path.StartsWithSegments(ApiPaths.HangfirePrefix),
                branch =>
                {
                    branch.UseBasicAuth<HangfireBasicAuthOptions>();
                    branch.UseHangfireDashboard(ApiPaths.HangfirePrefix, dashboardOptions);
                }
            );
        }
        else
        {
            app.UseHangfireDashboard(ApiPaths.HangfirePrefix, dashboardOptions);
        }

        RecurringJob.AddOrUpdate<ExpiredShareTokenCleanupJob>(
            "cleanup-expired-share-tokens",
            job => job.RunAsync(CancellationToken.None),
            Cron.Hourly
        );

        RecurringJob.AddOrUpdate<NotificationDeliveryRetryJob>(
            "retry-notification-deliveries",
            job => job.RunAsync(CancellationToken.None),
            "*/5 * * * *"
        );

        RecurringJob.AddOrUpdate<NotificationDeliveryCleanupJob>(
            "cleanup-notification-deliveries",
            job => job.RunAsync(CancellationToken.None),
            Cron.Daily
        );

        RecurringJob.AddOrUpdate<StaleTestRunCleanupJob>(
            "settle-stale-test-runs",
            job => job.RunAsync(CancellationToken.None),
            Cron.Hourly
        );

        RecurringJob.AddOrUpdate<IdempotencyCleanupJob>(
            "cleanup-idempotency-records",
            job => job.RunAsync(CancellationToken.None),
            Cron.Daily
        );

        return app;
    }
}
