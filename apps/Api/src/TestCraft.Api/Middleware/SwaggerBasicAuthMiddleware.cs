using System.Text;
using TestCraft.Api.Configuration.Swagger;
using TestCraft.Infrastructure.Security;

namespace TestCraft.Api.Middleware;

public class SwaggerBasicAuthMiddleware(RequestDelegate next, SwaggerBasicAuthOptions apiOptions)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (IsAuthorized(context.Request.Headers.Authorization.ToString()))
        {
            await next(context);
            return;
        }

        context.Response.Headers.WWWAuthenticate =
            "Basic realm=\"TestCraft API Docs\", charset=\"UTF-8\"";
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    }

    private bool IsAuthorized(string authorizationHeader)
    {
        var expectedUsername = apiOptions.SwaggerBasicAuthUsername;
        var expectedPassword = apiOptions.SwaggerBasicAuthPassword;

        if (string.IsNullOrEmpty(expectedUsername) || string.IsNullOrEmpty(expectedPassword))
        {
            return false;
        }

        const string prefix = "Basic ";
        if (!authorizationHeader.StartsWith(prefix, StringComparison.Ordinal))
        {
            return false;
        }

        string credentials;
        try
        {
            credentials = Encoding.UTF8.GetString(
                Convert.FromBase64String(authorizationHeader[prefix.Length..])
            );
        }
        catch (FormatException)
        {
            return false;
        }

        var separatorIndex = credentials.IndexOf(':', StringComparison.Ordinal);
        if (separatorIndex < 0)
        {
            return false;
        }

        var username = credentials[..separatorIndex];
        var password = credentials[(separatorIndex + 1)..];

        return FixedTimeCredentialComparer.Equals(username, expectedUsername)
            && FixedTimeCredentialComparer.Equals(password, expectedPassword);
    }
}

public static class SwaggerBasicAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseSwaggerBasicAuth(this IApplicationBuilder app) =>
        app.UseMiddleware<SwaggerBasicAuthMiddleware>();
}
