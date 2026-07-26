using TestCraft.Gateway;

namespace TestCraft.Gateway.Middleware;

public static class HttpsRedirectionExtensions
{
    public static IApplicationBuilder UseHttpsRedirectionWithAcmeExemption(
        this IApplicationBuilder app
    ) =>
        app.Use(
            async (context, next) =>
            {
                var path = context.Request.Path.Value ?? string.Empty;
                var isAcmeChallenge = path.StartsWith(
                    GatewayPaths.AcmeChallengePrefix,
                    StringComparison.Ordinal
                );

                if (!context.Request.IsHttps && !isAcmeChallenge)
                {
                    context.Response.StatusCode =
                        StatusCodes.Status307TemporaryRedirect;
                    context.Response.Headers.Location =
                        $"https://{context.Request.Host.Host}{context.Request.Path}{context.Request.QueryString}";
                    return;
                }

                await next();
            }
        );
}
