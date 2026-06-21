using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.ApiTokens;

public record ApiTokenResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required Guid ProjectId { get; init; }
    public DateTimeOffset? LastUsedAt { get; init; }
    public DateTimeOffset? ExpiresAt { get; init; }
    public required bool IsRevoked { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
}

public record CreateApiTokenResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Token { get; init; }
}

public static class CreateApiToken
{
    public sealed record Command : IRequest<CreateApiTokenResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required string Name { get; init; }
        public DateTimeOffset? ExpiresAt { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
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
