using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.ShareTokens;

public static class RevokeShareToken
{
    /// <summary>Revokes a share token, invalidating its public link.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public required Guid ProjectId { get; init; }

        /// <summary>The run the share token belongs to.</summary>
        public required Guid RunId { get; init; }

        /// <summary>The share token to revoke.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var shareToken =
                await context.ShareTokens.FirstOrDefaultAsync(
                    st => st.Id == request.Id && st.TestRunId == request.RunId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            context.ShareTokens.Remove(shareToken);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
