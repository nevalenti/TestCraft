using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.ProjectMembers;

public static class GetProjectMembers
{
    /// <summary>Lists the members of a project.</summary>
    public sealed record Query
        : IRequest<IReadOnlyList<ProjectMemberResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list members for.</summary>
        public required Guid ProjectId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<ProjectMemberResponse>>
    {
        public async Task<IReadOnlyList<ProjectMemberResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .ProjectMembers.Where(m => m.ProjectId == request.ProjectId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new ProjectMemberResponse
                {
                    Id = m.Id,
                    Email = m.Email,
                    DisplayName = m.DisplayName,
                    CreatedAt = m.CreatedAt,
                })
                .ToListAsync(cancellationToken);
    }
}
