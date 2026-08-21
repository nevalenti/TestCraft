using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.ShareTokens;

public static class GetShareTokens
{
    /// <summary>Lists the share tokens issued for a run.</summary>
    public sealed record Query : IRequest<IReadOnlyList<ShareTokenResponse>>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public required ProjectId ProjectId { get; init; }

        /// <summary>The run to list share tokens for.</summary>
        public required TestRunId RunId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<ShareTokenResponse>>
    {
        public async Task<IReadOnlyList<ShareTokenResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .ShareTokens.Where(st =>
                    st.TestRunId == request.RunId && st.TestRun!.ProjectId == request.ProjectId
                )
                .Select(st => new ShareTokenResponse
                {
                    Id = st.Id,
                    TestRunId = st.TestRunId,
                    Token = st.Token,
                    ExpiresAt = st.ExpiresAt,
                    CreatedAt = st.CreatedAt,
                })
                .ToListAsync(cancellationToken);
    }
}
