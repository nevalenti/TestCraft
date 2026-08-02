using TestCraft.Common.Security;

namespace TestCraft.Api.Middleware;

public class BasicAuthMiddleware<TOptions>(RequestDelegate next, TOptions options)
    where TOptions : IBasicAuthCredentials
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (
            BasicAuthValidator.IsAuthorized(
                context.Request.Headers.Authorization.ToString(),
                options.Username,
                options.Password
            )
        )
        {
            await next(context);
            return;
        }

        context.Response.Headers.WWWAuthenticate =
            $"Basic realm=\"{options.Realm}\", charset=\"UTF-8\"";
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    }
}

public static class BasicAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseBasicAuth<TOptions>(this IApplicationBuilder app)
        where TOptions : IBasicAuthCredentials =>
        app.UseMiddleware<BasicAuthMiddleware<TOptions>>();
}
