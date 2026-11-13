using Microsoft.Extensions.Options;
using Prometheus;
using TestCraft.Api.Errors;
using TestCraft.Infrastructure.Auth;

namespace TestCraft.Api.Configuration.RateLimiting;

public sealed class IpRateLimitMiddleware(
    RequestDelegate next,
    IRateLimitCounter counter,
    IOptions<RateLimitOptions> options
)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path;
        if (
            path.StartsWithSegments("/api")
            && path.Value is not ("/api/health" or "/api/ready")
            && !await RateLimits.AllowAsync(
                context,
                counter,
                "ip",
                $"ip:{Peer(context)}",
                options.Value.PerIp
            )
        )
        {
            return;
        }

        await next(context);
    }

    internal static string Peer(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

public sealed class PrincipalRateLimitMiddleware(
    RequestDelegate next,
    IRateLimitCounter counter,
    IOptions<RateLimitOptions> options
)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (await AllowAsync(context))
        {
            await next(context);
        }
    }

    private async Task<bool> AllowAsync(HttpContext context)
    {
        var request = context.Request;
        if (HttpMethods.IsGet(request.Method) && ApiPaths.IsPublicShare(request.Path))
        {
            return await RateLimits.AllowAsync(
                context,
                counter,
                "share",
                $"share-ip:{IpRateLimitMiddleware.Peer(context)}",
                options.Value.SharePerIp
            );
        }

        if (context.User.GetPrincipalKey() is not { } principal)
        {
            return true;
        }

        if (
            !await RateLimits.AllowAsync(
                context,
                counter,
                "principal",
                principal,
                options.Value.PerPrincipal
            )
        )
        {
            return false;
        }

        return context.GetEndpoint()?.Metadata.GetMetadata<MemberInviteRateLimitAttribute>() is null
            || await RateLimits.AllowAsync(
                context,
                counter,
                "member_invite",
                $"member-invite:{context.User.GetUserIdOrNull()}",
                options.Value.MemberInvitesPerPrincipal
            );
    }
}

[AttributeUsage(AttributeTargets.Method)]
public sealed class MemberInviteRateLimitAttribute : Attribute;

internal static class RateLimits
{
    private static readonly Counter Rejected = Metrics.CreateCounter(
        "testcraft_rate_limited_requests_total",
        "Requests rejected by a rate limit.",
        new CounterConfiguration { LabelNames = ["limit"] }
    );

    public static async Task<bool> AllowAsync(
        HttpContext context,
        IRateLimitCounter counter,
        string name,
        string key,
        int limit
    )
    {
        if (await counter.HitAsync(key, limit) is not { } retryAfter)
        {
            return true;
        }

        Rejected.WithLabels(name).Inc();
        context.Response.Headers.RetryAfter = retryAfter.ToString(
            System.Globalization.CultureInfo.InvariantCulture
        );
        await ProblemWriter.WriteAsync(context, Problems.TooManyRequests());

        return false;
    }
}
