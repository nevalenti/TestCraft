using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.ApiTokens.Commands.CreateApiToken;

public record CreateApiTokenCommand : IRequest<CreateApiTokenResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public DateTimeOffset? ExpiresAt { get; init; }
}

public class CreateApiTokenCommandValidator : AbstractValidator<CreateApiTokenCommand>
{
    public CreateApiTokenCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public class CreateApiTokenCommandHandler(
    IApplicationDbContext context,
    ICurrentUser currentUser,
    IApiTokenHasher hasher
) : IRequestHandler<CreateApiTokenCommand, CreateApiTokenResponse>
{
    public async Task<CreateApiTokenResponse> Handle(
        CreateApiTokenCommand request,
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
