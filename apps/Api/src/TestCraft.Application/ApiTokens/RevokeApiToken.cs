using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.ApiTokens;

public static class RevokeApiToken
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
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
}
