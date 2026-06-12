using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Responses;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.Commands;

public record UpdateProjectCommand : IRequest<ProjectResponse>, IProjectScopedRequest
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }

    Guid IProjectScopedRequest.ProjectId => Id;
}

public class UpdateProjectCommandValidator : AbstractValidator<UpdateProjectCommand>
{
    public UpdateProjectCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
    }
}

public class UpdateProjectCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProjectCommand, ProjectResponse>
{
    public async Task<ProjectResponse> Handle(
        UpdateProjectCommand request,
        CancellationToken cancellationToken
    )
    {
        var project =
            await context.Projects.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException();

        project.Name = request.Name;
        project.Description = request.Description;

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (DbErrorHelpers.IsUniqueViolation(ex))
        {
            throw new DomainException("A project with this name already exists");
        }

        return await context
            .Projects.Where(p => p.Id == project.Id)
            .Select(ProjectResponse.Projection)
            .FirstAsync(cancellationToken);
    }
}
