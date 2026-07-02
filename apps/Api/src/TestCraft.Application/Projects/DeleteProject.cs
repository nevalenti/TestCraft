using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Projects;

public static class DeleteProject
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        public required Guid Id { get; init; }

        Guid IProjectScopedRequest.ProjectId => Id;
    }

    public sealed class Handler(IApplicationDbContext context, ICurrentUser currentUser)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            await ProjectOwnershipGuard.EnsureOwnerAsync(
                context,
                request.Id,
                currentUser.UserId,
                cancellationToken
            );

            var project =
                await context.Projects.FirstOrDefaultAsync(
                    p => p.Id == request.Id,
                    cancellationToken
                ) ?? throw new NotFoundException();

            project.IsDeleted = true;
            project.DeletedAt = DateTimeOffset.UtcNow;

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
