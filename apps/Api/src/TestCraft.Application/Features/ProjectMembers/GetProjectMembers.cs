using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.ProjectMembers;

public static class GetProjectMembers
{
    /// <summary>Lists the members of a project.</summary>
    public sealed record Query
        : IRequest<IReadOnlyList<ProjectMemberResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list members for.</summary>
        public required ProjectId ProjectId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<ProjectMemberResponse>>
    {
        public async Task<IReadOnlyList<ProjectMemberResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .ProjectMembers.Where(member => member.ProjectId == request.ProjectId)
                .OrderBy(member => member.CreatedAt)
                .ThenBy(member => member.Id)
                .Select(member => ProjectMemberResponse.FromEntity(member))
                .ToListAsync(cancellationToken);
    }
}
