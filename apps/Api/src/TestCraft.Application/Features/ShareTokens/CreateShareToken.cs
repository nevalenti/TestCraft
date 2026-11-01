using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.ShareTokens;

/// <summary>A share token granting read-only public access to a run.</summary>
public record ShareTokenResponse
{
    /// <summary>The share token's identifier.</summary>
    public required ShareTokenId Id { get; init; }

    /// <summary>The run the token grants access to.</summary>
    public required TestRunId TestRunId { get; init; }

    /// <summary>When the token expires, if it has an expiry.</summary>
    public DateTimeOffset? ExpiresAt { get; init; }

    /// <summary>When the token was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}

/// <summary>A newly created share link. The raw token is shown only once.</summary>
public record CreateShareTokenResponse : ShareTokenResponse
{
    /// <summary>The token value used in the public share link.</summary>
    public required string Token { get; init; }
}

public static class CreateShareToken
{
    /// <summary>Creates a share token granting read-only public access to a run.</summary>
    public sealed record Command : IRequest<CreateShareTokenResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to share.</summary>
        [JsonIgnore]
        public TestRunId RunId { get; init; }

        /// <summary>When the share link should expire, if it should.</summary>
        public DateTimeOffset? ExpiresAt { get; init; }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        IApiTokenHasher hasher,
        TimeProvider timeProvider
    ) : IRequestHandler<Command, CreateShareTokenResponse>
    {
        public async Task<CreateShareTokenResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var runExists = await context.TestRuns.AnyAsync(
                run => run.Id == request.RunId && run.ProjectId == request.ProjectId,
                cancellationToken
            );

            if (!runExists)
            {
                throw new NotFoundException();
            }

            var token = hasher.GenerateToken();

            var shareToken = ShareToken.Create(
                request.RunId,
                hasher.Hash(token),
                request.ExpiresAt,
                currentUser.UserId,
                timeProvider.GetStoredUtcNow()
            );

            context.ShareTokens.Add(shareToken);

            await context.SaveChangesAsync(cancellationToken);

            return new CreateShareTokenResponse
            {
                Id = shareToken.Id,
                TestRunId = shareToken.TestRunId,
                Token = token,
                ExpiresAt = shareToken.ExpiresAt,
                CreatedAt = shareToken.CreatedAt,
            };
        }
    }
}
