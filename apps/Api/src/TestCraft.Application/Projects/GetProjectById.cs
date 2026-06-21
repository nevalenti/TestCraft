using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Projects;

public static class GetProjectById
{
    public sealed record Query : IRequest<ProjectResponse>, IProjectScopedRequest
    {
        public required Guid Id { get; init; }

        Guid IProjectScopedRequest.ProjectId => Id;
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, ProjectResponse>
    {
        public async Task<ProjectResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .Projects.Where(p => p.Id == request.Id)
                .Select(p => new ProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    SuiteCount = p.TestSuites.Count(s => !s.IsDeleted),
                    RunCount = p.TestRuns.Count(r => !r.IsDeleted),
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
