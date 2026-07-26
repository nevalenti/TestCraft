using TestCraft.Gateway;

namespace TestCraft.Gateway.Middleware;

public static class DotPathGuardExtensions
{
    public static IApplicationBuilder UseDotPathGuard(
        this IApplicationBuilder app
    ) =>
        app.Use(
            async (context, next) =>
            {
                var path = context.Request.Path.Value ?? string.Empty;
                var isDotPath = path.StartsWith("/.", StringComparison.Ordinal);
                var isWellKnown = path.StartsWith(
                    GatewayPaths.WellKnownPrefix,
                    StringComparison.Ordinal
                );

                if (isDotPath && !isWellKnown)
                {
                    context.Response.StatusCode =
                        StatusCodes.Status403Forbidden;
                    return;
                }

                await next();
            }
        );
}
