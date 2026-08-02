using TestCraft.Common.Security;
using TestCraft.Gateway;
using TestCraft.Gateway.Configuration;

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
                    && !BasicAuthValidator.IsAuthorized(
                        context.Request.Headers.Authorization.ToString(),
                        options.SeqBasicAuthUsername,
                        options.SeqBasicAuthPassword
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
