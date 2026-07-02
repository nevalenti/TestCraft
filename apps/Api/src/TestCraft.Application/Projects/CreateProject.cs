using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Projects;

public record ProjectResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public required int SuiteCount { get; init; }
    public required int RunCount { get; init; }
    public required bool IsOwner { get; init; }
}

public static class CreateProject
{
    public sealed record Command : IRequest<ProjectResponse>
    {
        public required string Name { get; init; }
        public string? Description { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
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
