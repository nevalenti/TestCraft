using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.Commands;

public record DeleteTestResultCommand : IRequest, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
    public required Guid Id { get; init; }
}

public class DeleteTestResultCommandHandler(IApplicationDbContext context, ICacheService cache)
    : IRequestHandler<DeleteTestResultCommand>
{
    public async Task Handle(DeleteTestResultCommand request, CancellationToken cancellationToken)
    {
        var result =
            await context.TestResults.FirstOrDefaultAsync(
                r => r.Id == request.Id && r.TestRunId == request.RunId,
                cancellationToken
            ) ?? throw new NotFoundException();

        result.IsDeleted = true;
        result.DeletedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        await cache.RemoveAsync(CacheKeys.TestRunResponse(request.RunId), cancellationToken);
    }
}
