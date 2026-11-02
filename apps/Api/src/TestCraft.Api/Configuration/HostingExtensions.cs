using Microsoft.Extensions.Options;
using Prometheus;
using TestCraft.Api.Configuration.Authentication;
using TestCraft.Api.Configuration.Controllers;
using TestCraft.Api.Configuration.Cors;
using TestCraft.Api.Configuration.Database;
using TestCraft.Api.Configuration.Hangfire;
using TestCraft.Api.Configuration.Observability;
using TestCraft.Api.Configuration.OutputCaching;
using TestCraft.Api.Configuration.Proxy;
using TestCraft.Api.Configuration.RateLimiting;
using TestCraft.Api.Configuration.Swagger;
using TestCraft.Api.Errors;
using TestCraft.Api.Idempotency;
using TestCraft.Api.Middleware;
using TestCraft.Api.Realtime;
using TestCraft.Application;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Common.Http;
using TestCraft.Infrastructure;
using TestCraft.Infrastructure.Configuration;
using TestCraft.Persistence;

namespace TestCraft.Api.Configuration;

public static class HostingExtensions
{
    public static void ConfigureServices(this WebApplicationBuilder builder)
    {
        builder.Host.UseDefaultServiceProvider(options =>
        {
            options.ValidateOnBuild = true;
            options.ValidateScopes = true;
        });
        builder.WebHost.ConfigureKestrel(options => options.AddServerHeader = false);

        var infrastructureOptions = builder.Services.AddStartupOptions<InfrastructureOptions>(
            builder.Configuration
        );
        var loggingOptions = builder.Services.AddStartupOptions<ApiLoggingOptions>(
            builder.Configuration
        );
        builder.Services.AddStartupOptions<DatabaseMigrationOptions>(builder.Configuration);
        builder.Services.AddStartupOptions<MetricsOptions>(builder.Configuration);

        builder
            .Services.AddPersistence(
                ConnectionStringHelpers.ToNpgsqlConnectionString(
                    infrastructureOptions.DatabaseUrl,
                    infrastructureOptions.DbPoolTimeoutSeconds,
                    infrastructureOptions.DbStatementTimeoutMs
                )
            )
            .AddInfrastructure<AppDbContext>(infrastructureOptions)
            .AddApplication()
            .AddResponseCompression(options => options.EnableForHttps = true);

        builder
            .AddSerilogLogging(loggingOptions)
            .AddOpenTelemetryTracing(loggingOptions)
            .AddObservabilityHealthChecks(infrastructureOptions)
            .AddTrustedProxies()
            .AddMaxBodySize()
            .AddRealtime(infrastructureOptions)
            .AddKeycloakAuthentication(infrastructureOptions.KeycloakVerifyTls)
            .AddApiControllers()
            .AddApiVersioningSupport()
            .AddErrorHandling()
            .AddCorsPolicy()
            .AddApiRateLimiting(infrastructureOptions)
            .AddSwaggerDocs()
            .AddHangfireJobs(infrastructureOptions)
            .AddOutputCaching();
    }

    public static void LogStartupConfiguration(this WebApplication app)
    {
        var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
        loggerFactory
            .CreateLogger(typeof(StartupConfigurationLogging))
            .LogStartupConfiguration(app.Services);
        loggerFactory
            .CreateLogger(typeof(InfrastructureFallbackLogging))
            .LogInfrastructureFallbacks(
                app.Services.GetRequiredService<IOptions<InfrastructureOptions>>().Value
            );
    }

    public static void ConfigurePipeline(this WebApplication app)
    {
        app.UseForwardedHeaders();

        app.UseRequestId();
        app.UsePageId();
        app.UseSecurityHeaders();
        app.UseCacheControl();
        app.UseIpRateLimit();
        app.UseResponseCompression();

        app.UseRequestLogging();

        app.UseExceptionHandler();

        app.UseRouting();

        app.UseMaxBodySize();

        app.UseWebSockets();

        app.UseHttpMetrics();
        app.UseObservabilityHealthChecks();

        app.UseCors(CorsExtensions.DefaultPolicyName);

        app.UseWhen(
            context => ApiPaths.IsVersionedApi(context.Request.Path),
            branch => branch.UseRequestTimeouts()
        );

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseMiddleware<IdempotencyMiddleware>();

        app.UsePrincipalRateLimit();

        app.UseOutputCache();

        app.UseUserLogContext();

        app.UseSwaggerDocs();
        app.UseHangfireJobs();

        app.MapControllers();
        app.MapRealtime();

        app.MapFallback(context => ProblemWriter.WriteAsync(context, Problems.NotFound()));
    }
}
