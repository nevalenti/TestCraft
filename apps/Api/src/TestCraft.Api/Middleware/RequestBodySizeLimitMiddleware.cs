using Microsoft.AspNetCore.Http.Features;

namespace TestCraft.Api.Middleware;

public class RequestBodySizeLimitMiddleware(RequestDelegate next)
{
    private const long MaxRequestBodySize = 100_000;

    public async Task InvokeAsync(HttpContext context)
    {
        var maxRequestBodySizeFeature = context.Features.Get<IHttpMaxRequestBodySizeFeature>();
        if (maxRequestBodySizeFeature is { IsReadOnly: false })
        {
            maxRequestBodySizeFeature.MaxRequestBodySize = MaxRequestBodySize;
        }

        await next(context);
    }
}

public static class RequestBodySizeLimitMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestBodySizeLimit(this IApplicationBuilder app) =>
        app.UseMiddleware<RequestBodySizeLimitMiddleware>();
}
