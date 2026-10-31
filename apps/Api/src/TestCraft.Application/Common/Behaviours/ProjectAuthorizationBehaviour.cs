using MediatR;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Common.Behaviours;

/// <summary>
/// Hides projects the caller can't see. The minimum role per action is checked over HTTP by
/// <c>ProjectRoleRequirement</c>; only controllers send requests, which an architecture test checks.
/// </summary>
public class ProjectAuthorizationBehaviour<TRequest, TResponse>(ProjectAccess projectAccess)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IProjectScopedRequest
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        if (await projectAccess.RoleOfAsync(request.ProjectId, cancellationToken) is null)
        {
            throw new NotFoundException();
        }

        return await next(cancellationToken);
    }
}
