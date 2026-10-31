using Microsoft.Net.Http.Headers;

namespace TestCraft.Api.Middleware;

public class CacheControlMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;
            if (!headers.ContainsKey(HeaderNames.CacheControl))
            {
                headers.CacheControl = headers.ContainsKey(HeaderNames.ETag)
                    ? "private, no-cache"
                    : "no-store";
            }

            return Task.CompletedTask;
        });

        await next(context);
    }
}

public static class CacheControlMiddlewareExtensions
{
    public static IApplicationBuilder UseCacheControl(this IApplicationBuilder app) =>
        app.UseMiddleware<CacheControlMiddleware>();
}
