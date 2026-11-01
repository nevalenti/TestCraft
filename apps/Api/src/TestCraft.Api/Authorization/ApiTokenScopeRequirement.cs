using Microsoft.AspNetCore.Authorization;
using TestCraft.Domain.Entities;
using TestCraft.Infrastructure.Auth;

namespace TestCraft.Api.Authorization;

public sealed class ApiTokenScopeRequirement : IAuthorizationRequirement;

public sealed class ApiTokenScopeHandler
    : AuthorizationHandler<ApiTokenScopeRequirement, HttpContext>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ApiTokenScopeRequirement requirement,
        HttpContext httpContext
    )
    {
        if (!context.User.IsApiToken())
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        var resource = httpContext
            .GetEndpoint()
            ?.Metadata.GetMetadata<ApiTokenScopeAttribute>()
            ?.Resource;
        if (resource is null)
        {
            context.Fail(
                new AuthorizationFailureReason(this, "API tokens cannot use this endpoint")
            );
            return Task.CompletedTask;
        }

        var method = httpContext.Request.Method;
        var write = !HttpMethods.IsGet(method) && !HttpMethods.IsHead(method);
        var scopes = context.User.FindAll("scope").Select(claim => claim.Value);
        if (ApiTokenScopes.Grants(scopes, resource, write))
        {
            context.Succeed(requirement);
        }
        else
        {
            var needed = $"{resource}_{(write ? "write" : "read")}";
            context.Fail(
                new AuthorizationFailureReason(this, $"This API token needs the {needed} scope")
            );
        }

        return Task.CompletedTask;
    }
}
