using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Caching;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestResults;

public static class DeleteTestResult
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        public required TestRunId RunId { get; init; }

        public required TestResultId Id { get; init; }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICacheService cache,
        ITestRunNotifier notifier,
        TimeProvider timeProvider
    ) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var result = await context.TestResults.FirstOrNotFoundAsync(
                existingResult =>
                    existingResult.Id == request.Id
                    && existingResult.TestRunId == request.RunId
                    && existingResult.TestRun!.ProjectId == request.ProjectId,
                cancellationToken
            );

            result.Delete(timeProvider.GetStoredUtcNow());

            await context.SaveChangesAsync(cancellationToken);

            await cache.RemoveAsync(CacheKeys.TestRunResponse(request.RunId), cancellationToken);

            await notifier.ResultDeletedAsync(request.RunId, request.Id, cancellationToken);
            await notifier.DashboardChangedAsync(
                request.ProjectId,
                request.RunId,
                cancellationToken
            );
        }
    }
}
