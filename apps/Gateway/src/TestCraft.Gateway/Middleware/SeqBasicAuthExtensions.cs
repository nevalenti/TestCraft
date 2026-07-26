using TestCraft.Gateway;
using TestCraft.Gateway.Configuration;
using TestCraft.Gateway.Security;

namespace TestCraft.Gateway.Middleware;

public static class SeqBasicAuthExtensions
{
    public static IApplicationBuilder UseSeqBasicAuth(
        this IApplicationBuilder app,
        SeqBasicAuthOptions options
    ) =>
        app.Use(
            async (context, next) =>
            {
                if (
                    context.Request.Path.StartsWithSegments(
                        GatewayPaths.SeqPrefix
                    )
                    && !SeqBasicAuth.IsAuthorized(
                        context.Request.Headers.Authorization.ToString(),
                        options
                    )
                )
                {
                    context.Response.Headers.WWWAuthenticate =
                        "Basic realm=\"TestCraft Logs\", charset=\"UTF-8\"";
                    context.Response.StatusCode =
                        StatusCodes.Status401Unauthorized;
                    return;
                }

                await next();
            }
        );
}
