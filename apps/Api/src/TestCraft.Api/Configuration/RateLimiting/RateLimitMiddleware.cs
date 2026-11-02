using System.Text.RegularExpressions;
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

public sealed partial class PrincipalRateLimitMiddleware(
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

        if (context.User.GetUserIdOrNull() is not { } userId)
        {
            return true;
        }

        var principal = context.User.FindFirst("api_token_id")?.Value is { } tokenId
            ? $"token:{tokenId}"
            : $"user:{userId}";
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

        return !HttpMethods.IsPost(request.Method)
            || !MembersPath().IsMatch(request.Path.Value ?? "")
            || await RateLimits.AllowAsync(
                context,
                counter,
                "member_invite",
                $"member-invite:{userId}",
                options.Value.MemberInvitesPerPrincipal
            );
    }

    [GeneratedRegex("^/api/v1/projects/[^/]+/members/?$")]
    private static partial Regex MembersPath();
}

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
