namespace TestCraft.Api.Middleware;

public class SecurityHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;
            headers["X-DNS-Prefetch-Control"] = "off";
            headers["X-Frame-Options"] = "SAMEORIGIN";
            headers["Strict-Transport-Security"] =
                "max-age=15552000; includeSubDomains";
            headers["X-Download-Options"] = "noopen";
            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Permitted-Cross-Domain-Policies"] = "none";
            headers["Referrer-Policy"] = "no-referrer";
            headers["X-XSS-Protection"] = "0";
            headers["Cross-Origin-Opener-Policy"] = "same-origin";
            headers["Cross-Origin-Resource-Policy"] = "same-origin";
            headers["Origin-Agent-Cluster"] = "?1";
            headers.Remove("X-Powered-By");
            headers.Remove("Server");

            return Task.CompletedTask;
        });

        await next(context);
    }
}

public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(
        this IApplicationBuilder app
    ) => app.UseMiddleware<SecurityHeadersMiddleware>();
}
