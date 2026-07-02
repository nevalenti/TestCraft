using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Projects;

public static class UpdateProject
{
    public sealed record Command : IRequest<ProjectResponse>, IProjectScopedRequest
    {
        public Guid Id { get; init; }
        public required string Name { get; init; }
        public string? Description { get; init; }

        Guid IProjectScopedRequest.ProjectId => Id;
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
            var project =
                await context.Projects.FirstOrDefaultAsync(
                    p => p.Id == request.Id,
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
                .Projects.Where(p => p.Id == project.Id)
                .Select(p => new ProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    SuiteCount = p.TestSuites.Count(s => !s.IsDeleted),
                    RunCount = p.TestRuns.Count(r => !r.IsDeleted),
                    IsOwner = p.UserId == currentUser.UserId,
                })
                .FirstAsync(cancellationToken);
        }
    }
}
