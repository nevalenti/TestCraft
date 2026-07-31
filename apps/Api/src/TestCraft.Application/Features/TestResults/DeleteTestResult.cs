using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.TestRuns;

namespace TestCraft.Application.Features.TestResults;

public static class DeleteTestResult
{
    /// <summary>Soft-deletes a test result.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public required Guid ProjectId { get; init; }

        /// <summary>The run the result belongs to.</summary>
        public required Guid RunId { get; init; }

        /// <summary>The result to delete.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICacheService cache,
        ITestRunNotifier notifier
    ) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var result =
                await context.TestResults.FirstOrDefaultAsync(
                    existingResult =>
                        existingResult.Id == request.Id
                        && existingResult.TestRunId == request.RunId
                        && existingResult.TestRun!.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            result.IsDeleted = true;
            result.DeletedAt = DateTimeOffset.UtcNow;

            await context.SaveChangesAsync(cancellationToken);

            await cache.RemoveAsync(CacheKeys.TestRunResponse(request.RunId), cancellationToken);
            await notifier.ResultDeletedAsync(request.RunId, request.Id, cancellationToken);
        }
    }
}
