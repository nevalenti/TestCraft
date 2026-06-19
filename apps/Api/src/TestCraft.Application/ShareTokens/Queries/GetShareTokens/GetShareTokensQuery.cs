using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.ShareTokens.Queries.GetShareTokens;

public record GetShareTokensQuery
    : IRequest<IReadOnlyList<ShareTokenResponse>>,
        IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
}

public class GetShareTokensQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetShareTokensQuery, IReadOnlyList<ShareTokenResponse>>
{
    public async Task<IReadOnlyList<ShareTokenResponse>> Handle(
        GetShareTokensQuery request,
        CancellationToken cancellationToken
    )
    {
        return await context
            .ShareTokens.Where(st => st.TestRunId == request.RunId)
            .Select(st => new ShareTokenResponse(
                st.Id,
                st.TestRunId,
                st.Token,
                st.ExpiresAt,
                st.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }
}
