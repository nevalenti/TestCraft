using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.ApiTokens;

public static class GetApiTokens
{
    /// <summary>Lists the API tokens issued for a project.</summary>
    public sealed record Query : IRequest<IReadOnlyList<ApiTokenResponse>>, IProjectScopedRequest
    {
        /// <summary>The project to list tokens for.</summary>
        public Guid ProjectId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<ApiTokenResponse>>
    {
        public async Task<IReadOnlyList<ApiTokenResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .ApiTokens.Where(token => token.ProjectId == request.ProjectId)
                .OrderByDescending(token => token.CreatedAt)
                .Select(token => new ApiTokenResponse
                {
                    Id = token.Id,
                    Name = token.Name,
                    ProjectId = token.ProjectId,
                    LastUsedAt = token.LastUsedAt,
                    ExpiresAt = token.ExpiresAt,
                    IsRevoked = token.IsRevoked,
                    CreatedAt = token.CreatedAt,
                })
                .ToListAsync(cancellationToken);
    }
}
