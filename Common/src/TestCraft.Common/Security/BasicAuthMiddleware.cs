using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace TestCraft.Common.Security;

public class BasicAuthMiddleware<TOptions>(
    RequestDelegate next,
    IOptions<TOptions> options
)
    where TOptions : class, IBasicAuthCredentials
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (
            BasicAuthValidator.IsAuthorized(
                context.Request.Headers.Authorization.ToString(),
                options.Value.Username,
                options.Value.Password
            )
        )
        {
            await next(context);
            return;
        }

        context.Response.Headers.WWWAuthenticate =
            $"Basic realm=\"{options.Value.Realm}\", charset=\"UTF-8\"";
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    }
}

public static class BasicAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseBasicAuth<TOptions>(
        this IApplicationBuilder app
    )
        where TOptions : class, IBasicAuthCredentials =>
        app.UseMiddleware<BasicAuthMiddleware<TOptions>>();
}
