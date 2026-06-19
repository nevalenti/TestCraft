using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.ShareTokens.Commands.CreateShareToken;

public record CreateShareTokenCommand : IRequest<ShareTokenResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public Guid RunId { get; init; }
    public DateTimeOffset? ExpiresAt { get; init; }
}

public class CreateShareTokenCommandHandler(IApplicationDbContext context, ICurrentUser currentUser)
    : IRequestHandler<CreateShareTokenCommand, ShareTokenResponse>
{
    public async Task<ShareTokenResponse> Handle(
        CreateShareTokenCommand request,
        CancellationToken cancellationToken
    )
    {
        var runExists = await context.TestRuns.AnyAsync(
            r => r.Id == request.RunId && r.ProjectId == request.ProjectId,
            cancellationToken
        );

        if (!runExists)
        {
            throw new NotFoundException();
        }

        var bytes = RandomNumberGenerator.GetBytes(16);
        var token = Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');

        var shareToken = new ShareToken
        {
            TestRunId = request.RunId,
            Token = token,
            ExpiresAt = request.ExpiresAt,
            CreatedById = currentUser.UserId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        context.ShareTokens.Add(shareToken);
        await context.SaveChangesAsync(cancellationToken);

        return new ShareTokenResponse(
            shareToken.Id,
            shareToken.TestRunId,
            shareToken.Token,
            shareToken.ExpiresAt,
            shareToken.CreatedAt
        );
    }
}
