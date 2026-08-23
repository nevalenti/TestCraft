using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.ProjectMembers;

public static class RemoveProjectMember
{
    /// <summary>Removes a member from a project. Owner-only.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project to remove the member from.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The membership to remove.</summary>
        public required ProjectMemberId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, ICurrentUser currentUser)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            await ProjectOwnershipGuard.EnsureOwnerAsync(
                context,
                request.ProjectId,
                currentUser.UserId,
                cancellationToken
            );

            var member =
                await context.ProjectMembers.FirstOrDefaultAsync(
                    existingMember =>
                        existingMember.Id == request.Id
                        && existingMember.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            context.ProjectMembers.Remove(member);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
