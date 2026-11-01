using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;

namespace TestCraft.Application.Features.Projects;

public static class UpdateProject
{
    /// <summary>Updates a project's name and description.</summary>
    public sealed record Command : IRequest<ProjectResponse>, IProjectScopedRequest
    {
        /// <summary>The project to update.</summary>
        [JsonIgnore]
        public ProjectId Id { get; init; }

        /// <summary>The project's new display name.</summary>
        public required string Name { get; init; }

        /// <summary>The project's new description.</summary>
        public string? Description { get; init; }

        [JsonIgnore]
        public int? ExpectedVersion { get; init; }

        ProjectId IProjectScopedRequest.ProjectId => Id;
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
            var project =
                await context.Projects.FirstOrDefaultAsync(
                    existingProject =>
                        existingProject.Id == request.Id
                        && existingProject.UserId == currentUser.UserId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            VersionCheck.Ensure(project, request.ExpectedVersion);
            project.Update(request.Name, request.Description);

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
