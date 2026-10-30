using Microsoft.Extensions.Options;
using Prometheus;
using TestCraft.Gateway.Middleware;

namespace TestCraft.Gateway.Configuration;

public static class HostingExtensions
{
    public static void ConfigureServices(this WebApplicationBuilder builder)
    {
        builder.Host.UseDefaultServiceProvider(options =>
        {
            options.ValidateOnBuild = true;
            options.ValidateScopes = true;
        });

        var loggingOptions =
            builder.Services.AddStartupOptions<GatewayLoggingOptions>(
                builder.Configuration
            );
        builder.Services.AddStartupOptions<GatewayMetricsOptions>(
            builder.Configuration
        );

        builder.WebHost.ConfigureKestrel(options =>
            options.AddServerHeader = false
        );

        builder.Services.AddProblemDetails();
        builder.Services.AddHealthChecks();

        builder
            .Services.AddReverseProxy()
            .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

        builder
            .AddSerilogLogging(loggingOptions)
            .AddOpenTelemetryTracing(loggingOptions);
    }

    public static void ConfigurePipeline(this WebApplication app)
    {
        app.UseExceptionHandler();

        app.UseRequestId();
        app.UseSecurityHeaders();
        app.UseRequestLogging();
        app.UseHttpsRedirectionWithAcmeExemption();
        app.UseLegacyPathRedirects();
        app.UseDotPathGuard();

        app.UseHttpMetrics();

        app.MapHealthChecks(GatewayPaths.HealthPath);
        app.MapGatewayMetrics(
            app.Services.GetRequiredService<
                IOptions<GatewayMetricsOptions>
            >().Value
        );
        app.MapReverseProxy();
    }
}
