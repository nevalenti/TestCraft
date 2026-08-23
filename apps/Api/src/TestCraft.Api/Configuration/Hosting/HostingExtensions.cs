using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;

using Prometheus;

using TestCraft.Api.Configuration.Authentication;
using TestCraft.Api.Configuration.Database;
using TestCraft.Api.Configuration.Hangfire;
using TestCraft.Api.Configuration.Observability;
using TestCraft.Api.Configuration.Swagger;
using TestCraft.Api.Errors;
using TestCraft.Api.Hubs;
using TestCraft.Api.Middleware;
using TestCraft.Application;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Common.Http;
using TestCraft.Infrastructure;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Hosting;

public static class HostingExtensions
{
    public static void ConfigureServices(this WebApplicationBuilder builder)
    {
        builder.Host.UseDefaultServiceProvider(
            (context, options) =>
            {
                options.ValidateOnBuild = true;
                options.ValidateScopes = context.HostingEnvironment.IsDevelopment();
            }
        );

        var keycloakAuthOptions = KeycloakAuthOptions.Bind(builder.Configuration);
        var corsOptions = CorsOptions.Bind(builder.Configuration);
        var loggingOptions = ApiLoggingOptions.Bind(builder.Configuration);
        var migrationOptions = DatabaseMigrationOptions.Bind(builder.Configuration);
        var metricsOptions = MetricsOptions.Bind(builder.Configuration);
        var swaggerBasicAuthOptions = SwaggerBasicAuthOptions.Bind(builder.Configuration);
        var hangfireBasicAuthOptions = HangfireBasicAuthOptions.Bind(builder.Configuration);

        builder.Services.AddStartupOptions(keycloakAuthOptions);
        builder.Services.AddStartupOptions(corsOptions);
        builder.Services.AddStartupOptions(loggingOptions);
        builder.Services.AddStartupOptions(migrationOptions);
        builder.Services.AddStartupOptions(metricsOptions);
        builder.Services.AddStartupOptions(swaggerBasicAuthOptions);
        builder.Services.AddStartupOptions(hangfireBasicAuthOptions);

        builder.Services.AddInfrastructure(builder.Configuration);
        builder.Services.AddApplication();

        builder.Services.AddResponseCompression(options => options.EnableForHttps = true);

        builder.Services.Configure<KestrelServerOptions>(options =>
            options.Limits.MaxRequestBodySize = 100_000
        );

        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders =
                ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });

        builder.Services.AddSignalR();
        builder.Services.AddScoped<ITestRunNotifier, SignalRTestRunNotifier>();

        builder
            .AddSerilogLogging(loggingOptions)
            .AddOpenTelemetryTracing(loggingOptions)
            .AddKeycloakAuthentication(keycloakAuthOptions)
            .AddApiControllers()
            .AddApiVersioningSupport()
            .AddErrorHandling()
            .AddCorsPolicy(corsOptions)
            .AddApiRateLimiting()
            .AddSwaggerDocs()
            .AddHangfireJobs()
            .AddOutputCaching();
    }

    public static void ConfigurePipeline(this WebApplication app)
    {
        app.UseForwardedHeaders();

        app.UseExceptionHandler();

        app.UseRequestId();
        app.UsePageId();
        app.UseSecurityHeaders();
        app.UseResponseCompression();

        app.UseRequestLogging();

        app.UseRouting();

        app.UseHttpMetrics();

        app.UseCors(CorsExtensions.DefaultPolicyName);

        app.UseWhen(
            context => ApiPaths.IsVersionedApi(context.Request.Path),
            branch => branch.UseRequestTimeouts()
        );

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseRateLimiter();

        app.UseOutputCache();

        app.UseUserLogContext();

        app.UseSwaggerDocs();
        app.UseHangfireJobs();

        app.MapControllers();
        app.MapHub<TestRunHub>("/hubs/test-run");

        app.MapFallback(context => ProblemWriter.WriteAsync(context, Problems.NotFound()));
    }
}
