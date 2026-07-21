using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Prometheus;
using TestCraft.Api.Errors;
using TestCraft.Api.Hubs;
using TestCraft.Api.Middleware;
using TestCraft.Application;
using TestCraft.Application.TestRuns;
using TestCraft.Infrastructure;

namespace TestCraft.Api.Configuration;

public static class HostingExtensions
{
    public static WebApplicationBuilder ConfigureServices(this WebApplicationBuilder builder)
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

        builder.Services.AddSingleton(keycloakAuthOptions);
        builder.Services.AddSingleton(corsOptions);
        builder.Services.AddSingleton(loggingOptions);
        builder.Services.AddSingleton(migrationOptions);
        builder.Services.AddSingleton(metricsOptions);
        builder.Services.AddSingleton(swaggerBasicAuthOptions);

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

        return builder
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

    public static WebApplication ConfigureApplication(this WebApplication app)
    {
        app.UseForwardedHeaders();

        app.UseExceptionHandler();

        app.UseRequestId();
        app.UseSecurityHeaders();
        app.UseResponseCompression();

        app.UseRequestLogging();

        app.UseRouting();

        app.UseHttpMetrics();

        app.UseRateLimiter();

        app.UseCors(CorsExtensions.DefaultPolicyName);

        app.UseWhen(
            context => ApiPaths.IsVersionedApi(context.Request.Path),
            branch => branch.UseRequestTimeouts()
        );

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseOutputCache();

        app.UseUserLogContext();

        app.UseSwaggerDocs();
        app.UseHangfireJobs();

        app.MapControllers();
        app.MapHub<TestRunHub>("/hubs/test-run");

        app.MapFallback(context => ProblemWriter.WriteAsync(context, Problems.NotFound()));

        return app;
    }
}
