using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.ProjectMembers;

public static class UpdateProjectMember
{
    /// <summary>Changes a member's role.</summary>
    public sealed record Command : IRequest<ProjectMemberResponse>, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public ProjectMemberId Id { get; init; }

        [JsonIgnore]
        public ProjectRole ActorRole { get; init; }

        /// <summary>The member's new role.</summary>
        public required AssignableRole Role { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Role).IsInEnum();
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, ProjectMemberResponse>
    {
        public async Task<ProjectMemberResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var member = await context.ProjectMembers.FirstOrNotFoundAsync(
                existingMember =>
                    existingMember.Id == request.Id
                    && existingMember.ProjectId == request.ProjectId,
                cancellationToken
            );

            MemberManagement.EnsureCanManage(request.ActorRole, member.Role, request.Role);

            member.ChangeRole(request.Role);

            await context.SaveChangesAsync(cancellationToken);

            return ProjectMemberResponse.FromEntity(member);
        }
    }
}
