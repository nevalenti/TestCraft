using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.RateLimiting;

public static class RateLimitingExtensions
{
    private static readonly string[] UnlimitedEnvironments =
    [
        "Development",
        "Local",
        "Test",
        "Testing",
    ];

    public static WebApplicationBuilder AddApiRateLimiting(
        this WebApplicationBuilder builder,
        InfrastructureOptions infrastructureOptions
    )
    {
        builder.Services.AddStartupOptions<RateLimitOptions>(builder.Configuration);

        if (string.IsNullOrEmpty(infrastructureOptions.RedisUrl))
        {
            builder.Services.AddSingleton<IRateLimitCounter, InMemoryRateLimitCounter>();
        }
        else
        {
            builder.Services.AddSingleton<IRateLimitCounter, RedisRateLimitCounter>();
        }

        return builder;
    }

    public static bool IsRateLimited(this IHostEnvironment environment) =>
        !UnlimitedEnvironments.Any(name => environment.IsEnvironment(name));

    public static IApplicationBuilder UseIpRateLimit(this WebApplication app) =>
        app.Environment.IsRateLimited() ? app.UseMiddleware<IpRateLimitMiddleware>() : app;

    public static IApplicationBuilder UsePrincipalRateLimit(this WebApplication app) =>
        app.Environment.IsRateLimited() ? app.UseMiddleware<PrincipalRateLimitMiddleware>() : app;
}
