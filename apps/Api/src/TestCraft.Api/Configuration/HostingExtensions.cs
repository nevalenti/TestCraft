using System.Security.Claims;
using Microsoft.AspNetCore.HttpOverrides;
using Serilog;
using Serilog.Events;
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

        app.UseSerilogRequestLogging(options =>
        {
            options.GetLevel = GetRequestLogLevel;

            options.EnrichDiagnosticContext = EnrichRequestDiagnosticContext;
        });

        app.UseHttpRequestMetrics();

        app.UseRequestBodySizeLimit();

        app.UseRouting();

        app.UseRateLimiter();

        app.UseCors(CorsExtensions.DefaultPolicyName);

        app.UseWhen(
            context => ApiPaths.IsVersionedApi(context.Request.Path),
            branch => branch.UseRequestTimeout()
        );

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseSwaggerDocs();

        app.MapControllers();

        app.MapFallback(context => ProblemWriter.WriteAsync(context, Problems.NotFound()));

        return app;
    }

    private static LogEventLevel GetRequestLogLevel(
        HttpContext httpContext,
        double elapsedMilliseconds,
        Exception? exception
    )
    {
        if (exception is not null)
        {
            return LogEventLevel.Error;
        }

        if (httpContext.Request.Path.Value is "/api/health" or "/api/metrics")
        {
            return LogEventLevel.Verbose;
        }

        return LogEventLevel.Information;
    }

    private static void EnrichRequestDiagnosticContext(
        IDiagnosticContext diagnosticContext,
        HttpContext httpContext
    )
    {
        diagnosticContext.Set(
            "req",
            new { method = httpContext.Request.Method, url = httpContext.Request.Path.Value },
            destructureObjects: true
        );

        var user = httpContext.User;
        if (user.Identity?.IsAuthenticated != true)
        {
            return;
        }

        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (userId is not null)
        {
            diagnosticContext.Set("userId", userId);
        }

        var username =
            user.FindFirstValue("preferred_username") ?? user.FindFirstValue(ClaimTypes.Name);
        if (username is not null)
        {
            diagnosticContext.Set("username", username);
        }
    }
}
