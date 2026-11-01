using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestRuns;

public static class GetTestRuns
{
    public enum SortField
    {
        Name,
        Environment,
        Status,
        CreatedAt,
        UpdatedAt,
    }

    /// <summary>Lists the test runs in a project; search matches the run name.</summary>
    public sealed record Query
        : SearchPageQuery,
            IRequest<Paginated<TestRunResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list runs for.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        /// <summary>Only runs with this status.</summary>
        public TestRunStatus? Status { get; init; }

        public SortField SortBy { get; init; } = SortField.CreatedAt;

        public SortDirection SortDir { get; init; } = SortDirection.Desc;
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestRunResponse>>
    {
        public Task<Paginated<TestRunResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.TestRuns.Where(run => run.ProjectId == request.ProjectId);

            query = query.WhereContainsIgnoringCase(run => run.Name, request.Search);

            if (request.Status is { } status)
            {
                query = query.Where(run => run.Status == status);
            }

            var sorted = request.SortBy switch
            {
                SortField.Name => query.SortedBy(run => run.Name, request.SortDir, run => run.Id),
                SortField.Environment => query.SortedBy(
                    run => run.Environment,
                    request.SortDir,
                    run => run.Id
                ),
                SortField.Status => query.SortedBy(
                    run => run.Status,
                    request.SortDir,
                    run => run.Id
                ),
                SortField.UpdatedAt => query.SortedBy(
                    run => run.UpdatedAt,
                    request.SortDir,
                    run => run.Id
                ),
                _ => query.SortedBy(run => run.CreatedAt, request.SortDir, run => run.Id),
            };

            return sorted
                .Select(TestRunResponse.Projection)
                .ToPaginatedAsync(request.ToPagination(), cancellationToken);
        }
    }
}
