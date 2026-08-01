using Serilog.Context;

namespace TestCraft.Api.Middleware;

public class PageIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "x-page-id";

    public async Task InvokeAsync(HttpContext context)
    {
        var incoming = context.Request.Headers[HeaderName].FirstOrDefault();
        if (incoming is null || !Guid.TryParse(incoming, out _))
        {
            await next(context);
            return;
        }

        using (LogContext.PushProperty("pageId", incoming))
        {
            await next(context);
        }
    }
}

public static class PageIdMiddlewareExtensions
{
    public static IApplicationBuilder UsePageId(this IApplicationBuilder app) =>
        app.UseMiddleware<PageIdMiddleware>();
}
