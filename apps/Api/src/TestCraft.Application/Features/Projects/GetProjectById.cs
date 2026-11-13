using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Projects;

public static class GetProjectById
{
    public sealed record Query : IRequest<ProjectResponse>, IProjectScopedRequest
    {
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
