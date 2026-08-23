using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.ApiTokens;

public static class RevokeApiToken
{
    /// <summary>Revokes an API token, permanently disabling it.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the token belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The token to revoke.</summary>
        public required ApiTokenId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var token =
                await context.ApiTokens.FirstOrDefaultAsync(
                    apiToken =>
                        apiToken.Id == request.Id && apiToken.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            token.IsRevoked = true;
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
