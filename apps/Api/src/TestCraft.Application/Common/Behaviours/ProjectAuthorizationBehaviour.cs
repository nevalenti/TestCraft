using MediatR;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Common.Behaviours;

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
