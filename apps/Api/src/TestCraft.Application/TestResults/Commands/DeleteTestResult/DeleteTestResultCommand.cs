using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestResults.Commands.DeleteTestResult;

public record DeleteTestResultCommand : IRequest, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
    public required Guid Id { get; init; }
}

public class DeleteTestResultCommandHandler(
    IApplicationDbContext context,
    ICacheService cache,
    ITestRunNotifier notifier
) : IRequestHandler<DeleteTestResultCommand>
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
        await notifier.ResultDeletedAsync(request.RunId, request.Id, cancellationToken);
    }
}
