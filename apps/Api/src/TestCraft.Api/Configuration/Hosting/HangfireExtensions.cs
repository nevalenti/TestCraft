using Hangfire;
using Hangfire.PostgreSql;
using TestCraft.Api.Middleware;
using TestCraft.Application.Features.ShareTokens;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Hosting;

public static class HangfireExtensions
{
    public static WebApplicationBuilder AddHangfireJobs(this WebApplicationBuilder builder)
    {
        var infrastructureOptions = InfrastructureOptions.Bind(builder.Configuration);
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

        return builder;
    }

    public static WebApplication UseHangfireJobs(this WebApplication app)
    {
        var hangfireBasicAuthOptions = app.Services.GetRequiredService<HangfireBasicAuthOptions>();
        var dashboardOptions = new DashboardOptions
        {
            Authorization =
            [
                new HangfireDashboardAuthorizationFilter(hangfireBasicAuthOptions, app.Environment),
            ],
        };

        if (app.Environment.IsProduction())
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

        return app;
    }
}
