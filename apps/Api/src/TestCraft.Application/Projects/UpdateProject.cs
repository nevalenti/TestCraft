using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Projects;

public static class UpdateProject
{
    /// <summary>Updates a project's name and description.</summary>
    public sealed record Command : IRequest<ProjectResponse>, IProjectScopedRequest
    {
        /// <summary>The project to update.</summary>
        public Guid Id { get; init; }

        /// <summary>The project's new display name.</summary>
        public required string Name { get; init; }

        /// <summary>The project's new description.</summary>
        public string? Description { get; init; }

        Guid IProjectScopedRequest.ProjectId => Id;
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
            var project =
                await context.Projects.FirstOrDefaultAsync(
                    existingProject => existingProject.Id == request.Id,
                    cancellationToken
                ) ?? throw new NotFoundException();

            project.Name = request.Name;
            project.Description = request.Description;

            try
            {
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (dbExceptionClassifier.IsUniqueViolation(ex))
            {
                throw new DomainException("A project with this name already exists");
            }

            return await context
                .Projects.Where(updatedProject => updatedProject.Id == project.Id)
                .Select(updatedProject => new ProjectResponse
                {
                    Id = updatedProject.Id,
                    Name = updatedProject.Name,
                    Description = updatedProject.Description,
                    CreatedAt = updatedProject.CreatedAt,
                    UpdatedAt = updatedProject.UpdatedAt,
                    SuiteCount = updatedProject.TestSuites.Count(suite => !suite.IsDeleted),
                    RunCount = updatedProject.TestRuns.Count(run => !run.IsDeleted),
                    IsOwner = updatedProject.UserId == currentUser.UserId,
                })
                .FirstAsync(cancellationToken);
        }
    }
}
