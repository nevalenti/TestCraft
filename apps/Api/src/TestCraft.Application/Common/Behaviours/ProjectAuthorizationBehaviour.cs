using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Errors;

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
        var isOwner = await context.Projects.AnyAsync(
            p => p.Id == request.ProjectId && p.UserId == currentUser.UserId,
            cancellationToken
        );

        if (!isOwner)
        {
            throw new NotFoundException();
        }

        return await next(cancellationToken);
    }
}
