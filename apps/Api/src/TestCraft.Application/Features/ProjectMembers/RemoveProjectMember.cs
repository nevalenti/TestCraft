using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.ProjectMembers;

public static class RemoveProjectMember
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        public required ProjectMemberId Id { get; init; }

        [JsonIgnore]
        public ProjectRole ActorRole { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var member = await context.ProjectMembers.FirstOrNotFoundAsync(
                existingMember =>
                    existingMember.Id == request.Id
                    && existingMember.ProjectId == request.ProjectId,
                cancellationToken
            );

            MemberManagement.EnsureCanManage(request.ActorRole, member.Role);

            context.ProjectMembers.Remove(member);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
