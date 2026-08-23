using Serilog.Context;

using TestCraft.Api.Extensions;

namespace TestCraft.Api.Middleware;

public class UserLogContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var user = context.User;
        if (user.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        var properties = new List<IDisposable>();

        var userId = user.GetUserIdOrNull();
        if (userId is not null)
        {
            properties.Add(LogContext.PushProperty("userId", userId));
        }

        var username = user.GetUsernameOrNull();
        if (username is not null)
        {
            properties.Add(LogContext.PushProperty("username", username));
        }

        try
        {
            await next(context);
        }
        finally
        {
            for (var i = properties.Count - 1; i >= 0; i--)
            {
                properties[i].Dispose();
            }
        }
    }
}

public static class UserLogContextMiddlewareExtensions
{
    public static IApplicationBuilder UseUserLogContext(this IApplicationBuilder app) =>
        app.UseMiddleware<UserLogContextMiddleware>();
}
