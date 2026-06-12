using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Responses;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.Commands;

public record CreateProjectCommand : IRequest<ProjectResponse>
{
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public class CreateProjectCommandValidator : AbstractValidator<CreateProjectCommand>
{
    public CreateProjectCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
    }
}

public class CreateProjectCommandHandler(IApplicationDbContext context, ICurrentUser currentUser)
    : IRequestHandler<CreateProjectCommand, ProjectResponse>
{
    public async Task<ProjectResponse> Handle(
        CreateProjectCommand request,
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
        catch (DbUpdateException ex) when (DbErrorHelpers.IsUniqueViolation(ex))
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
        };
    }
}
