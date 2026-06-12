using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.Projects.Queries.GetProjectById;

public record GetProjectByIdQuery : IRequest<ProjectResponse>, IProjectScopedRequest
{
    public required Guid Id { get; init; }

    Guid IProjectScopedRequest.ProjectId => Id;
}

public class GetProjectByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetProjectByIdQuery, ProjectResponse>
{
    public async Task<ProjectResponse> Handle(
        GetProjectByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .Projects.Where(p => p.Id == request.Id)
            .Select(ProjectResponse.Projection)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
