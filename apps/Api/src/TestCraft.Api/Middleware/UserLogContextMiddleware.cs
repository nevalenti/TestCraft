using Serilog.Context;

using TestCraft.Common.Logging;
using TestCraft.Infrastructure.Auth;

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

        var userId = user.GetUserIdOrNull();
        var username = user.GetUserName();

        using (
            LogContextExtensions.PushProperties(
                userId is not null ? LogContext.PushProperty("userId", userId) : null,
                username is not null ? LogContext.PushProperty("username", username) : null
            )
        )
        {
            await next(context);
        }
    }
}

public static class UserLogContextMiddlewareExtensions
{
    public static IApplicationBuilder UseUserLogContext(this IApplicationBuilder app) =>
        app.UseMiddleware<UserLogContextMiddleware>();
}
