using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.ShareTokens;

public static class RevokeShareToken
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        public required TestRunId RunId { get; init; }

        public required ShareTokenId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var shareToken = await context.ShareTokens.FirstOrNotFoundAsync(
                st =>
                    st.Id == request.Id
                    && st.TestRunId == request.RunId
                    && st.TestRun!.ProjectId == request.ProjectId,
                cancellationToken
            );

            context.ShareTokens.Remove(shareToken);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
