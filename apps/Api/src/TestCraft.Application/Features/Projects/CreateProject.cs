using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Projects;

/// <summary>A project that groups suites, plans, and runs.</summary>
public record ProjectResponse
{
    /// <summary>The project's identifier.</summary>
    public required ProjectId Id { get; init; }

    /// <summary>The project's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The project's description, if set.</summary>
    public string? Description { get; init; }

    /// <summary>When the project was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the project was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }

    /// <summary>The number of non-deleted suites in the project.</summary>
    public required int SuiteCount { get; init; }

    /// <summary>The number of non-deleted runs in the project.</summary>
    public required int RunCount { get; init; }

    /// <summary>Whether the current user owns the project, as opposed to being a member.</summary>
    public required bool IsOwner { get; init; }
}

public static class CreateProject
{
    /// <summary>Creates a new project owned by the current user.</summary>
    public sealed record Command : IRequest<ProjectResponse>
    {
        /// <summary>The project's display name.</summary>
        public required string Name { get; init; }

        /// <summary>The project's description.</summary>
        public string? Description { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).NotEmpty().MaximumLength(255);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        IDbExceptionClassifier dbExceptionClassifier
    ) : IRequestHandler<Command, ProjectResponse>
    {
        public async Task<ProjectResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var project = new Project
            {
                Id = ProjectId.New(),
                UserId = currentUser.UserId,
                Name = request.Name,
                Description = request.Description,
            };

            context.Projects.Add(project);

            try
            {
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (dbExceptionClassifier.IsUniqueViolation(ex))
            {
                throw new DomainException("A project with this name already exists");
            }

            return new ProjectResponse
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                SuiteCount = 0,
                RunCount = 0,
                IsOwner = true,
            };
        }
    }
}
