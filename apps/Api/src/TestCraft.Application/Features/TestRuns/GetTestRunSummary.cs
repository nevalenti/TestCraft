using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestRuns;

public static class GetTestRunSummary
{
    /// <summary>Requests aggregated result counts for a run.</summary>
    public sealed record Query : IRequest<Response>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public required ProjectId ProjectId { get; init; }

        /// <summary>The run to summarize.</summary>
        public required TestRunId Id { get; init; }
    }

    /// <summary>Aggregated result counts for a run.</summary>
    public sealed record Response
    {
        /// <summary>The number of test cases with a current outcome in the run.</summary>
        public required int Total { get; init; }

        /// <summary>The number of passed results.</summary>
        public required int Passed { get; init; }

        /// <summary>The number of failed results.</summary>
        public required int Failed { get; init; }

        /// <summary>The number of blocked results.</summary>
        public required int Blocked { get; init; }

        /// <summary>The number of skipped results.</summary>
        public required int Skipped { get; init; }

        /// <summary>The number of planned cases awaiting execution.</summary>
        public required int Untested { get; init; }

        /// <summary>The pass rate, as a whole-number percentage.</summary>
        public required double PassRate { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, ICacheService cache)
        : IRequestHandler<Query, Response>
    {
        public async Task<Response> Handle(Query request, CancellationToken cancellationToken)
        {
            var exists = await context.TestRuns.AnyAsync(
                run => run.Id == request.Id && run.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!exists)
            {
                throw new NotFoundException();
            }

            var key = CacheKeys.TestRunResponse(request.Id);
            var cached = await cache.GetAsync<Response>(key, cancellationToken);
            if (cached is not null)
            {
                return cached;
            }

            var counts = await StatusCounts.CountByStatusAsync(
                context
                    .TestResults.Where(result => result.TestRunId == request.Id)
                    .CurrentOutcomes(),
                cancellationToken
            );

            var summary = new Response
            {
                Total = counts.Total,
                Passed = counts.Passed,
                Failed = counts.Failed,
                Blocked = counts.Blocked,
                Skipped = counts.Skipped,
                Untested = counts.Untested,
                PassRate = counts.PassRate ?? 0,
            };

            await cache.SetAsync(key, summary, cancellationToken: cancellationToken);

            return summary;
        }
    }
}
