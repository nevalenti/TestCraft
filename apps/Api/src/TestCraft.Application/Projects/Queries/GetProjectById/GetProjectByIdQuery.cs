using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Projects.Queries.GetProjectById;

public record GetProjectByIdQuery : IRequest<ProjectResponse>, IProjectScopedRequest
{
    public required Guid Id { get; init; }

    Guid IProjectScopedRequest.ProjectId => Id;
}

public class GetProjectByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetProjectByIdQuery, ProjectResponse>
{
    public async Task<ProjectResponse> Handle(
        GetProjectByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .Projects.Where(p => p.Id == request.Id)
            .ProjectTo<ProjectResponse>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
