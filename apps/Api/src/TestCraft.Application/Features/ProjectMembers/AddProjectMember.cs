using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Application.Features.ProjectMembers;

public static class AddProjectMember
{
    /// <summary>Adds a user to a project by email, with a role.</summary>
    public sealed record Command : IRequest<ProjectMemberResponse>, IProjectScopedRequest
    {
        /// <summary>The project to add the member to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The caller's own role, which limits the roles they can hand out.</summary>
        [JsonIgnore]
        public ProjectRole ActorRole { get; init; }

        /// <summary>The email address of the user to add.</summary>
        public required string Email { get; init; }

        /// <summary>The role to give the new member.</summary>
        public AssignableRole Role { get; init; } = AssignableRole.Editor;
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Email).NotEmpty().EmailAddress().MaximumLength(254);
            RuleFor(command => command.Role).IsInEnum();
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        IKeycloakUserDirectory keycloakUsers,
        IDbExceptionClassifier dbExceptionClassifier
    ) : IRequestHandler<Command, ProjectMemberResponse>
    {
        public async Task<ProjectMemberResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            MemberManagement.EnsureCanManage(request.ActorRole, request.Role);

            var keycloakUser =
                await keycloakUsers.FindByEmailAsync(request.Email, cancellationToken)
                ?? throw new DomainException("No user found with that email address")
                {
                    ErrorCode = DomainErrorCodes.UserNotFound,
                };

            if (!keycloakUser.EmailVerified)
            {
                throw new DomainException("That user has not verified their email address yet")
                {
                    ErrorCode = DomainErrorCodes.EmailNotVerified,
                };
            }

            var isOwner = await context.Projects.AnyAsync(
                project => project.Id == request.ProjectId && project.UserId == keycloakUser.Id,
                cancellationToken
            );
            if (isOwner)
            {
                throw new DomainException("That user already owns this project")
                {
                    ErrorCode = DomainErrorCodes.AlreadyProjectOwner,
                };
            }

            var member = ProjectMember.Create(
                request.ProjectId,
                keycloakUser.Id,
                keycloakUser.Email,
                keycloakUser.DisplayName,
                request.Role
            );

            context.ProjectMembers.Add(member);

            await context.SaveOrConflictAsync(
                dbExceptionClassifier,
                new ConflictException(
                    "This user is already a member of the project",
                    DomainErrorCodes.MemberAlreadyExists
                ),
                cancellationToken
            );

            return ProjectMemberResponse.FromEntity(member);
        }
    }
}
