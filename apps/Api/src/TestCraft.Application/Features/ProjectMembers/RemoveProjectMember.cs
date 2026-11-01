using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.ProjectMembers;

public static class RemoveProjectMember
{
    /// <summary>Removes a member from a project. Owner-only.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project to remove the member from.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The membership to remove.</summary>
        public required ProjectMemberId Id { get; init; }

        /// <summary>The caller's own role, which limits the members they can remove.</summary>
        [JsonIgnore]
        public ProjectRole ActorRole { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var member =
                await context.ProjectMembers.FirstOrDefaultAsync(
                    existingMember =>
                        existingMember.Id == request.Id
                        && existingMember.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            MemberManagement.EnsureCanManage(request.ActorRole, member.Role);

            context.ProjectMembers.Remove(member);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
