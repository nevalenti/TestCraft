namespace TestCraft.Api.Middleware;

public class ApiVersionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["X-API-Version"] = "1";

            return Task.CompletedTask;
        });

        await next(context);
    }
}

public static class ApiVersionMiddlewareExtensions
{
    public static IApplicationBuilder UseApiVersion(this IApplicationBuilder app) =>
        app.UseMiddleware<ApiVersionMiddleware>();
}
