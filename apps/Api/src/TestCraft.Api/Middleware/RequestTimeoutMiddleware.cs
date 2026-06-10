using TestCraft.Api.Errors;

namespace TestCraft.Api.Middleware;

public class RequestTimeoutMiddleware(RequestDelegate next)
{
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(30);

    public async Task InvokeAsync(HttpContext context)
    {
        var originalToken = context.RequestAborted;
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(
            originalToken
        );
        timeoutCts.CancelAfter(Timeout);
        context.RequestAborted = timeoutCts.Token;

        try
        {
            await next(context);
        }
        catch (OperationCanceledException)
            when (timeoutCts.IsCancellationRequested
                && !originalToken.IsCancellationRequested
            )
        {
            if (!context.Response.HasStarted)
            {
                context.RequestAborted = originalToken;
                await ProblemWriter.WriteAsync(context, Problems.Timeout());
            }
        }
        finally
        {
            context.RequestAborted = originalToken;
        }
    }
}

public static class RequestTimeoutMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestTimeout(
        this IApplicationBuilder app
    ) => app.UseMiddleware<RequestTimeoutMiddleware>();
}
