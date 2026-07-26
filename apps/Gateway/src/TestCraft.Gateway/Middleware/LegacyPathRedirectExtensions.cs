using TestCraft.Gateway;

namespace TestCraft.Gateway.Middleware;

public static class LegacyPathRedirectExtensions
{
    private static readonly Dictionary<string, string> Redirects = new(
        StringComparer.Ordinal
    )
    {
        ["/keycloak"] = "https://auth.testcraft.pro/",
        ["/grafana"] = "/grafana/",
        [GatewayPaths.SeqPrefix] = $"{GatewayPaths.SeqPrefix}/",
        ["/docs"] = "/docs/",
    };

    public static IApplicationBuilder UseLegacyPathRedirects(
        this IApplicationBuilder app
    ) =>
        app.Use(
            async (context, next) =>
            {
                var path = context.Request.Path.Value ?? string.Empty;

                if (Redirects.TryGetValue(path, out var redirect))
                {
                    context.Response.Redirect(redirect, permanent: true);
                    return;
                }

                await next();
            }
        );
}
