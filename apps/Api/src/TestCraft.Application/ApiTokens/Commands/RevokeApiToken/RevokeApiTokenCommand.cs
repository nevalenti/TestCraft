using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.ApiTokens.Commands.RevokeApiToken;

public record RevokeApiTokenCommand : IRequest, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class RevokeApiTokenCommandHandler(IApplicationDbContext context)
    : IRequestHandler<RevokeApiTokenCommand>
{
    public async Task Handle(RevokeApiTokenCommand request, CancellationToken cancellationToken)
    {
        var token =
            await context.ApiTokens.FirstOrDefaultAsync(
                t => t.Id == request.Id && t.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        token.IsRevoked = true;
        await context.SaveChangesAsync(cancellationToken);
    }
}
