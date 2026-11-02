using MediatR;
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
        public Task<ProjectResponse> Handle(Query request, CancellationToken cancellationToken) =>
            ProjectStats.LoadAsync(context, request.Id, currentUser.UserId, cancellationToken);
    }
}
