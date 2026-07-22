using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Common.Behaviours;

public class ProjectAuthorizationBehaviour<TRequest, TResponse>(
    IApplicationDbContext context,
    ICurrentUser currentUser
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IProjectScopedRequest
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var hasAccess = await context.Projects.AnyAsync(
            project =>
                project.Id == request.ProjectId
                && (
                    project.UserId == currentUser.UserId
                    || project.Members.Any(member => member.UserId == currentUser.UserId)
                ),
            cancellationToken
        );

        if (!hasAccess)
        {
            throw new NotFoundException();
        }

        return await next(cancellationToken);
    }
}
