using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.ShareTokens.Commands.RevokeShareToken;

public record RevokeShareTokenCommand : IRequest, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
    public required Guid Id { get; init; }
}

public class RevokeShareTokenCommandHandler(IApplicationDbContext context)
    : IRequestHandler<RevokeShareTokenCommand>
{
    public async Task Handle(RevokeShareTokenCommand request, CancellationToken cancellationToken)
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
