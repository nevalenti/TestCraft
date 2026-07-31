using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.ApiTokens;

/// <summary>An API token issued for machine-to-machine access to a project.</summary>
public record ApiTokenResponse
{
    /// <summary>The token's identifier.</summary>
    public required Guid Id { get; init; }

    /// <summary>The token's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The project the token grants access to.</summary>
    public required Guid ProjectId { get; init; }

    /// <summary>When the token was last used to authenticate, if ever.</summary>
    public DateTimeOffset? LastUsedAt { get; init; }

    /// <summary>When the token expires, if it has an expiry.</summary>
    public DateTimeOffset? ExpiresAt { get; init; }

    /// <summary>Whether the token has been revoked.</summary>
    public required bool IsRevoked { get; init; }

    /// <summary>When the token was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}

/// <summary>A newly created API token, including its one-time-visible raw value.</summary>
public record CreateApiTokenResponse
{
    /// <summary>The token's identifier.</summary>
    public required Guid Id { get; init; }

    /// <summary>The token's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The raw token value. Only ever returned once, at creation time.</summary>
    public required string Token { get; init; }
}

public static class CreateApiToken
{
    /// <summary>Creates a new API token for a project.</summary>
    public sealed record Command : IRequest<CreateApiTokenResponse>, IProjectScopedRequest
    {
        /// <summary>The project to create the token for.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The token's display name.</summary>
        public required string Name { get; init; }

        /// <summary>When the token should expire, if it should.</summary>
        public DateTimeOffset? ExpiresAt { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).NotEmpty().MaximumLength(100);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        IApiTokenHasher hasher
    ) : IRequestHandler<Command, CreateApiTokenResponse>
    {
        public async Task<CreateApiTokenResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var rawToken = hasher.GenerateToken();
            var tokenHash = hasher.Hash(rawToken);

            var token = new ApiToken
            {
                Name = request.Name,
                TokenHash = tokenHash,
                ProjectId = request.ProjectId,
                CreatedById = currentUser.UserId,
                ExpiresAt = request.ExpiresAt,
            };

            context.ApiTokens.Add(token);
            await context.SaveChangesAsync(cancellationToken);

            return new CreateApiTokenResponse
            {
                Id = token.Id,
                Name = token.Name,
                Token = rawToken,
            };
        }
    }
}
