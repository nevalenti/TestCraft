using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestRuns;

public static class DeleteTestRun
{
    /// <summary>Soft-deletes a test run.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to delete.</summary>
        public required TestRunId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, ICacheService cache)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var run =
                await context.TestRuns.FirstOrDefaultAsync(
                    existingRun =>
                        existingRun.Id == request.Id && existingRun.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            run.IsDeleted = true;
            run.DeletedAt = DateTimeOffset.UtcNow;

            await context.SaveChangesAsync(cancellationToken);

            await cache.RemoveAsync(CacheKeys.TestRunResponse(run.Id), cancellationToken);
        }
    }
}
