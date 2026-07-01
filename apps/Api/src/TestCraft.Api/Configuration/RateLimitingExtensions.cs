using System.Threading.RateLimiting;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Configuration;

public static class RateLimitingExtensions
{
    public static WebApplicationBuilder AddApiRateLimiting(this WebApplicationBuilder builder)
    {
        builder.Services.AddRateLimiter(options =>
        {
            options.OnRejected = async (context, _) =>
                await ProblemWriter.WriteAsync(context.HttpContext, Problems.TooManyRequests());

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
                httpContext =>
                {
                    var userAgent = httpContext.Request.Headers.UserAgent.ToString();

                    if (
                        !builder.Environment.IsProduction()
                        || !ApiPaths.IsVersionedApi(httpContext.Request.Path)
                        || userAgent.StartsWith(
                            "TestCraft-GitHub-Actions/",
                            StringComparison.Ordinal
                        )
                        || userAgent.StartsWith("TestCraft-Reporter/", StringComparison.Ordinal)
                    )
                    {
                        return RateLimitPartition.GetNoLimiter("unrestricted");
                    }

                    var partitionKey =
                        httpContext.User.FindFirst("sub")?.Value
                        ?? httpContext.Connection.RemoteIpAddress?.ToString()
                        ?? "anonymous";

                    return RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey,
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 1000,
                            Window = TimeSpan.FromMinutes(15),
                            QueueLimit = 0,
                        }
                    );
                }
            );
        });

        return builder;
    }
}
