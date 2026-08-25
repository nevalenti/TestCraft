using Hangfire.Dashboard;

using TestCraft.Common.Security;

namespace TestCraft.Api.Configuration.Hangfire;

public class HangfireDashboardAuthorizationFilter(
    HangfireBasicAuthOptions options,
    IWebHostEnvironment environment
) : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        if (!environment.IsProduction())
        {
            return true;
        }

        var httpContext = context.GetHttpContext();

        return BasicAuthValidator.IsAuthorized(
            httpContext.Request.Headers.Authorization.ToString(),
            options.Username,
            options.Password
        );
    }
}
