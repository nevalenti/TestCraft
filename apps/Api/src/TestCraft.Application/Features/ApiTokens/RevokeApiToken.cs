using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.ApiTokens;

public static class RevokeApiToken
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        public required ApiTokenId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var token = await context.ApiTokens.FirstOrNotFoundAsync(
                apiToken => apiToken.Id == request.Id && apiToken.ProjectId == request.ProjectId,
                cancellationToken
            );

            token.Revoke();

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
