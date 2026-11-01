using Microsoft.AspNetCore.Authorization;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;
using TestCraft.Infrastructure.Auth;

namespace TestCraft.Api.Authorization;

public sealed class ProjectRoleRequirement : IAuthorizationRequirement;

public sealed record ProjectRoleFeature(ProjectRole Role);

public sealed class ProjectNotFoundReason(IAuthorizationHandler handler)
    : AuthorizationFailureReason(handler, "The project does not exist or is not shared with you");

public sealed class ProjectRoleHandler(ProjectAccess projectAccess)
    : AuthorizationHandler<ProjectRoleRequirement, HttpContext>
{
    private const ProjectRole ApiTokenRole = ProjectRole.Editor;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ProjectRoleRequirement requirement,
        HttpContext httpContext
    )
    {
        if (context.HasFailed)
        {
            return;
        }

        if (
            context.User.Identity?.IsAuthenticated != true
            || !Guid.TryParse(httpContext.GetRouteValue("projectId")?.ToString(), out var projectId)
        )
        {
            context.Succeed(requirement);
            return;
        }

        if (
            await projectAccess.RoleOfAsync(ProjectId.From(projectId), httpContext.RequestAborted)
            is not { } role
        )
        {
            context.Fail(new ProjectNotFoundReason(this));
            return;
        }

        if (context.User.IsApiToken() && role.HasAtLeast(ApiTokenRole))
        {
            role = ApiTokenRole;
        }

        var roles =
            httpContext.GetEndpoint()?.Metadata.GetMetadata<ProjectRolesAttribute>()
            ?? new ProjectRolesAttribute();
        var minimum = IsRead(httpContext.Request.Method) ? roles.Read : roles.Write;
        if (!role.HasAtLeast(minimum))
        {
            context.Fail(
                new AuthorizationFailureReason(
                    this,
                    $"This action requires the {minimum.ToString().ToLowerInvariant()} role or higher"
                )
            );
            return;
        }

        httpContext.Features.Set(new ProjectRoleFeature(role));
        context.Succeed(requirement);
    }

    private static bool IsRead(string method) =>
        HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method);
}
