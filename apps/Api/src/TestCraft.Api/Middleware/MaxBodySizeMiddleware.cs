using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Middleware;

public class MaxBodySizeMiddleware(RequestDelegate next)
{
    public const long DefaultLimit = 100_000;

    public const long MultipartOverheadBytes = 16_384;

    public async Task InvokeAsync(HttpContext context)
    {
        var metadata = context.GetEndpoint()?.Metadata.GetMetadata<IRequestSizeLimitMetadata>();
        var limit = metadata is null ? DefaultLimit : metadata.MaxRequestBodySize;

        if (context.Request.ContentLength > limit)
        {
            await ProblemWriter.WriteAsync(context, Problems.ContentTooLarge());
            return;
        }

        if (context.Features.Get<IHttpMaxRequestBodySizeFeature>() is { IsReadOnly: false } feature)
        {
            feature.MaxRequestBodySize = limit;
        }

        await next(context);
    }
}

public static class MaxBodySizeMiddlewareExtensions
{
    public static WebApplicationBuilder AddMaxBodySize(this WebApplicationBuilder builder)
    {
        builder.Services.Configure<KestrelServerOptions>(options =>
            options.Limits.MaxRequestBodySize = MaxBodySizeMiddleware.DefaultLimit
        );

        return builder;
    }

    public static IApplicationBuilder UseMaxBodySize(this IApplicationBuilder app) =>
        app.UseMiddleware<MaxBodySizeMiddleware>();
}
