using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Projects;

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
            RuleFor(command => command.Name).NotEmpty().MaximumLength(FieldLengths.Name);
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
            var project = Project.Create(request.Name, request.Description, currentUser.UserId);

            context.Projects.Add(project);

            await context.SaveOrConflictAsync(
                dbExceptionClassifier,
                CatalogConflicts.ProjectNameTaken(),
                cancellationToken
            );

            return await ProjectStats.LoadAsync(
                context,
                project.Id,
                currentUser.UserId,
                cancellationToken
            );
        }
    }
}
