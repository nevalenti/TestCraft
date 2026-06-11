namespace TestCraft.Api.Middleware;

public class RequestIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "x-request-id";

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId =
            context.Request.Headers[HeaderName].FirstOrDefault() ?? Guid.NewGuid().ToString();

        context.Request.Headers[HeaderName] = requestId;
        context.TraceIdentifier = requestId;

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = requestId;

            return Task.CompletedTask;
        });

        await next(context);
    }
}

public static class RequestIdMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestId(this IApplicationBuilder app) =>
        app.UseMiddleware<RequestIdMiddleware>();
}
