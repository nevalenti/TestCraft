using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Projects.Commands.DeleteProject;

public record DeleteProjectCommand : IRequest, IProjectScopedRequest
{
    public required Guid Id { get; init; }

    Guid IProjectScopedRequest.ProjectId => Id;
}

public class DeleteProjectCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteProjectCommand>
{
    public async Task Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
    {
        var project =
            await context.Projects.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException();

        project.IsDeleted = true;
        project.DeletedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
    }
}
