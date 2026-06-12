using Microsoft.AspNetCore.Http.Timeouts;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using TestCraft.Api.Errors;
using TestCraft.Api.Middleware;
using TestCraft.Application;
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

        return builder
            .AddSerilogLogging()
            .AddKeycloakAuthentication()
            .AddApiControllers()
            .AddApiVersioningSupport()
            .AddErrorHandling()
            .AddCorsPolicy()
            .AddApiRateLimiting()
            .AddSwaggerDocs();
    }

    public static WebApplication ConfigureApplication(this WebApplication app)
    {
        app.UseForwardedHeaders();

        app.UseExceptionHandler();

        app.UseRequestId();
        app.UseSecurityHeaders();
        app.UseResponseCompression();

        app.UseRequestLogging();

        app.UseHttpRequestMetrics();

        app.UseRouting();

        app.UseRateLimiter();

        app.UseCors(CorsExtensions.DefaultPolicyName);

        app.UseWhen(
            context => ApiPaths.IsVersionedApi(context.Request.Path),
            branch => branch.UseRequestTimeouts()
        );

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseSwaggerDocs();

        app.MapControllers();

        app.MapFallback(context => ProblemWriter.WriteAsync(context, Problems.NotFound()));

        return app;
    }
}
