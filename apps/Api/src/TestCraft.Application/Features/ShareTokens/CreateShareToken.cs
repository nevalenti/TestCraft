using System.Security.Cryptography;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
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

    /// <summary>The token value used in the public share link.</summary>
    public required string Token { get; init; }

    /// <summary>When the token expires, if it has an expiry.</summary>
    public DateTimeOffset? ExpiresAt { get; init; }

    /// <summary>When the token was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}

public static class CreateShareToken
{
    /// <summary>Creates a share token granting read-only public access to a run.</summary>
    public sealed record Command : IRequest<ShareTokenResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to share.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public TestRunId RunId { get; init; }

        /// <summary>When the share link should expire, if it should.</summary>
        public DateTimeOffset? ExpiresAt { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, ICurrentUser currentUser)
        : IRequestHandler<Command, ShareTokenResponse>
    {
        public async Task<ShareTokenResponse> Handle(
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

            var bytes = RandomNumberGenerator.GetBytes(16);
            var token = Convert
                .ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');

            var shareToken = new ShareToken
            {
                Id = ShareTokenId.New(),
                TestRunId = request.RunId,
                Token = token,
                ExpiresAt = request.ExpiresAt,
                CreatedById = currentUser.UserId,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            context.ShareTokens.Add(shareToken);
            await context.SaveChangesAsync(cancellationToken);

            return new ShareTokenResponse
            {
                Id = shareToken.Id,
                TestRunId = shareToken.TestRunId,
                Token = shareToken.Token,
                ExpiresAt = shareToken.ExpiresAt,
                CreatedAt = shareToken.CreatedAt,
            };
        }
    }
}
