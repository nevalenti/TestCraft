using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.ProjectMembers;

/// <summary>A user with collaborator access to a project.</summary>
public record ProjectMemberResponse
{
    /// <summary>The membership's identifier.</summary>
    public required Guid Id { get; init; }

    /// <summary>The member's email address.</summary>
    public required string Email { get; init; }

    /// <summary>The member's display name, if set.</summary>
    public string? DisplayName { get; init; }

    /// <summary>When the member was added to the project.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}

public static class AddProjectMember
{
    /// <summary>Adds a user to a project by email. Owner-only.</summary>
    public sealed record Command : IRequest<ProjectMemberResponse>, IProjectScopedRequest
    {
        /// <summary>The project to add the member to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The email address of the user to add.</summary>
        public required string Email { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Email).NotEmpty().EmailAddress().MaximumLength(254);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        IKeycloakUserDirectory keycloakUsers,
        IDbExceptionClassifier dbExceptionClassifier
    ) : IRequestHandler<Command, ProjectMemberResponse>
    {
        public async Task<ProjectMemberResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            await ProjectOwnershipGuard.EnsureOwnerAsync(
                context,
                request.ProjectId,
                currentUser.UserId,
                cancellationToken
            );

            var keycloakUser =
                await keycloakUsers.FindByEmailAsync(request.Email, cancellationToken)
                ?? throw new DomainException("No user found with that email address");

            if (keycloakUser.Id == currentUser.UserId)
                throw new DomainException("You already own this project");

            var member = new ProjectMember
            {
                ProjectId = request.ProjectId,
                UserId = keycloakUser.Id,
                Email = keycloakUser.Email,
                DisplayName = keycloakUser.DisplayName,
            };
            context.ProjectMembers.Add(member);

            try
            {
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (dbExceptionClassifier.IsUniqueViolation(ex))
            {
                throw new DomainException("This user is already a member of the project");
            }

            return new ProjectMemberResponse
            {
                Id = member.Id,
                Email = member.Email,
                DisplayName = member.DisplayName,
                CreatedAt = member.CreatedAt,
            };
        }
    }
}
