using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestResults;

public static class GetTestResults
{
    public enum SortField
    {
        TestCaseName,
        Status,
        DurationMs,
        ExecutedAt,
        CreatedAt,
    }

    /// <summary>Lists the test results within a run; search matches the test case name.</summary>
    public sealed record Query
        : SearchPageQuery,
            IRequest<Paginated<TestResultResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to list results for.</summary>
        [RouteValue]
        public TestRunId RunId { get; init; }

        /// <summary>Only results with this status.</summary>
        public TestResultStatus? Status { get; init; }

        public SortField SortBy { get; init; } = SortField.CreatedAt;

        public SortDirection SortDir { get; init; } = SortDirection.Asc;
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestResultResponse>>
    {
        public async Task<Paginated<TestResultResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var runExists = await context.TestRuns.AnyAsync(
                run => run.Id == request.RunId && run.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!runExists)
            {
                throw new NotFoundException();
            }

            var query = context.LiveResults().Where(result => result.TestRunId == request.RunId);

            if (request.Status is { } status)
            {
                query = query.Where(result => result.Status == status);
            }

            query = query.WhereContainsIgnoringCase(
                result => result.TestCase!.Name,
                request.Search
            );

            var direction = request.SortDir;
            var sorted = request.SortBy switch
            {
                SortField.TestCaseName => query.SortedBy(
                    result => result.TestCase!.Name,
                    direction,
                    result => result.Id
                ),
                SortField.Status => query.SortedBy(
                    result => result.Status,
                    direction,
                    result => result.Id
                ),
                SortField.DurationMs => query.SortedBy(
                    result => result.DurationMs,
                    direction,
                    result => result.Id
                ),
                SortField.ExecutedAt => query.SortedBy(
                    result => result.ExecutedAt,
                    direction,
                    result => result.Id
                ),
                _ => query.SortedBy(result => result.CreatedAt, direction, result => result.Id),
            };

            return await sorted
                .Select(TestResultResponse.Projection)
                .ToPaginatedAsync(request.ToPagination(), cancellationToken);
        }
    }
}
