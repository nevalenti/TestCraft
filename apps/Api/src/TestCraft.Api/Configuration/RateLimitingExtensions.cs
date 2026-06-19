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
                    if (
                        !builder.Environment.IsProduction()
                        || !ApiPaths.IsVersionedApi(httpContext.Request.Path)
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
                            PermitLimit = 200,
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
