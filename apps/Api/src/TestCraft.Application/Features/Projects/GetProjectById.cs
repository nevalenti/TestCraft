using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Projects;

public static class GetProjectById
{
    /// <summary>Requests a single project by id.</summary>
    public sealed record Query : IRequest<ProjectResponse>, IProjectScopedRequest
    {
        /// <summary>The project to look up.</summary>
        public required ProjectId Id { get; init; }

        ProjectId IProjectScopedRequest.ProjectId => Id;
    }

    public sealed class Handler(IApplicationDbContext context, ICurrentUser currentUser)
        : IRequestHandler<Query, ProjectResponse>
    {
        public async Task<ProjectResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .Projects.Where(project => project.Id == request.Id)
                .Select(project => new ProjectResponse
                {
                    Id = project.Id,
                    Name = project.Name,
                    Description = project.Description,
                    CreatedAt = project.CreatedAt,
                    UpdatedAt = project.UpdatedAt,
                    SuiteCount = project.TestSuites.Count(suite => !suite.IsDeleted),
                    RunCount = project.TestRuns.Count(run => !run.IsDeleted),
                    IsOwner = project.UserId == currentUser.UserId,
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
