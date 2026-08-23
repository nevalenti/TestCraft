using Hangfire.Dashboard;

using TestCraft.Api.Middleware;
using TestCraft.Common.Security;

namespace TestCraft.Api.Configuration.Hangfire;

/// <summary>
/// Default-deny authorization enforced by Hangfire itself, independent of the outer Basic Auth
/// middleware — so a future pipeline-ordering change can't accidentally leave the dashboard open.
/// </summary>
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
