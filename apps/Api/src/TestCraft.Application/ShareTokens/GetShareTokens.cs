using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.ShareTokens;

public static class GetShareTokens
{
    public sealed record Query : IRequest<IReadOnlyList<ShareTokenResponse>>, IProjectScopedRequest
    {
        public required Guid ProjectId { get; init; }
        public required Guid RunId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<ShareTokenResponse>>
    {
        public async Task<IReadOnlyList<ShareTokenResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
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
