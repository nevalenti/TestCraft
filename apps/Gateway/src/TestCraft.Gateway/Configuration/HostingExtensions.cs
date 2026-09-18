using Prometheus;

using TestCraft.Common.Http;
using TestCraft.Common.Security;
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

        var loggingOptions = GatewayLoggingOptions.Bind(builder.Configuration);

        builder.Services.AddSingleton(loggingOptions);
        builder.Services.AddSingleton(services =>
            SeqBasicAuthOptions.Bind(services.GetRequiredService<IConfiguration>())
        );
        builder.Services.AddSingleton(services =>
            GatewayMetricsOptions.Bind(services.GetRequiredService<IConfiguration>())
        );

        builder.WebHost.ConfigureKestrel(options => options.AddServerHeader = false);

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

        app.UseWhen(
            context => context.Request.Path.StartsWithSegments(GatewayPaths.SeqPrefix),
            branch => branch.UseBasicAuth<SeqBasicAuthOptions>()
        );

        app.UseHttpMetrics();

        app.MapHealthChecks(GatewayPaths.HealthPath);
        app.MapGatewayMetrics(app.Services.GetRequiredService<GatewayMetricsOptions>());
        app.MapReverseProxy();
    }
}
