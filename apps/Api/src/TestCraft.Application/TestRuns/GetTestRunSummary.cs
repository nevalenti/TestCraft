using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestRuns;

public static class GetTestRunSummary
{
    public sealed record Query : IRequest<Response>, IProjectScopedRequest
    {
        public required Guid ProjectId { get; init; }
        public required Guid Id { get; init; }
    }

    public sealed record Response
    {
        public required int Total { get; init; }
        public required int Passed { get; init; }
        public required int Failed { get; init; }
        public required int Blocked { get; init; }
        public required int Skipped { get; init; }
        public required int PassRate { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, ICacheService cache)
        : IRequestHandler<Query, Response>
    {
        public async Task<Response> Handle(Query request, CancellationToken cancellationToken)
        {
            var key = CacheKeys.TestRunResponse(request.Id);
            var cached = await cache.GetAsync<Response>(key, cancellationToken);
            if (cached is not null)
            {
                return cached;
            }

            var exists = await context.TestRuns.AnyAsync(
                r => r.Id == request.Id && r.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!exists)
            {
                throw new NotFoundException();
            }

            var counts = await context
                .TestResults.Where(r => r.TestRunId == request.Id)
                .GroupBy(r => r.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync(cancellationToken);

            var passed =
                counts.FirstOrDefault(c => c.Status == TestResultStatus.Passed)?.Count ?? 0;
            var failed =
                counts.FirstOrDefault(c => c.Status == TestResultStatus.Failed)?.Count ?? 0;
            var blocked =
                counts.FirstOrDefault(c => c.Status == TestResultStatus.Blocked)?.Count ?? 0;
            var skipped =
                counts.FirstOrDefault(c => c.Status == TestResultStatus.Skipped)?.Count ?? 0;
            var total = passed + failed + blocked + skipped;
            var passRate = total > 0 ? (int)Math.Round(passed * 100.0 / total) : 0;

            var summary = new Response
            {
                Total = total,
                Passed = passed,
                Failed = failed,
                Blocked = blocked,
                Skipped = skipped,
                PassRate = passRate,
            };

            await cache.SetAsync(key, summary, cancellationToken: cancellationToken);

            return summary;
        }
    }
}
