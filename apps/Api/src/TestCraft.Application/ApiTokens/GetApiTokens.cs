using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.ApiTokens;

public static class GetApiTokens
{
    public sealed record Query : IRequest<IReadOnlyList<ApiTokenResponse>>, IProjectScopedRequest
    {
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
                .ApiTokens.Where(t => t.ProjectId == request.ProjectId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new ApiTokenResponse
                {
                    Id = t.Id,
                    Name = t.Name,
                    ProjectId = t.ProjectId,
                    LastUsedAt = t.LastUsedAt,
                    ExpiresAt = t.ExpiresAt,
                    IsRevoked = t.IsRevoked,
                    CreatedAt = t.CreatedAt,
                })
                .ToListAsync(cancellationToken);
    }
}
