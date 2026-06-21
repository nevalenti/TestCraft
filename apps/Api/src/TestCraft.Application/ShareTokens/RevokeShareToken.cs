using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.ShareTokens;

public static class RevokeShareToken
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        public required Guid ProjectId { get; init; }
        public required Guid RunId { get; init; }
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
