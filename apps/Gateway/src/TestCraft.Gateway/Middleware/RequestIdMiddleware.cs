using Serilog.Context;

namespace TestCraft.Gateway.Middleware;

public class RequestIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "x-request-id";

    public async Task InvokeAsync(HttpContext context)
    {
        var incoming = context.Request.Headers[HeaderName].FirstOrDefault();
        var requestId =
            incoming is not null && Guid.TryParse(incoming, out _)
                ? incoming
                : Guid.NewGuid().ToString();

        context.Request.Headers[HeaderName] = requestId;
        context.TraceIdentifier = requestId;

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = requestId;

            return Task.CompletedTask;
        });

        using (LogContext.PushProperty("requestId", requestId))
        {
            await next(context);
        }
    }
}

public static class RequestIdMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestId(
        this IApplicationBuilder app
    ) => app.UseMiddleware<RequestIdMiddleware>();
}
