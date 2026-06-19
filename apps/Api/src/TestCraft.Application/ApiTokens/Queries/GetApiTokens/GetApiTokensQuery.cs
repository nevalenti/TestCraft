using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.ApiTokens.Queries.GetApiTokens;

public record GetApiTokensQuery : IRequest<IReadOnlyList<ApiTokenResponse>>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
}

public class GetApiTokensQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetApiTokensQuery, IReadOnlyList<ApiTokenResponse>>
{
    public async Task<IReadOnlyList<ApiTokenResponse>> Handle(
        GetApiTokensQuery request,
        CancellationToken cancellationToken
    )
    {
        return await context
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
