namespace TestCraft.Gateway.Middleware;

public static class SecurityHeadersExtensions
{
    private const string StrictTransportSecurity =
        "max-age=15552000; includeSubDomains";

    public static IApplicationBuilder UseSecurityHeaders(
        this IApplicationBuilder app
    ) =>
        app.Use(
            async (context, next) =>
            {
                context.Response.OnStarting(() =>
                {
                    var headers = context.Response.Headers;
                    if (context.Request.IsHttps)
                    {
                        headers.StrictTransportSecurity =
                            StrictTransportSecurity;
                    }

                    headers.Remove("Server");
                    headers.Remove("X-Powered-By");

                    return Task.CompletedTask;
                });

                await next();
            }
        );
}
