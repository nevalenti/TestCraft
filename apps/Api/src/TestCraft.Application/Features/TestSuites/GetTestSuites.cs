using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestSuites;

public static class GetTestSuites
{
    public enum SortField
    {
        Name,
        CreatedAt,
    }

    /// <summary>Lists the test suites in a project; search matches the suite name.</summary>
    public sealed record Query
        : SearchPageQuery,
            IRequest<Paginated<TestSuiteResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list suites for.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        public SortField SortBy { get; init; } = SortField.CreatedAt;

        public SortDirection SortDir { get; init; } = SortDirection.Asc;
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestSuiteResponse>>
    {
        public async Task<Paginated<TestSuiteResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.TestSuites.Where(suite => suite.ProjectId == request.ProjectId);

            query = query.WhereContainsIgnoringCase(suite => suite.Name, request.Search);

            var sorted =
                request.SortBy == SortField.Name
                    ? query.SortedBy(suite => suite.Name, request.SortDir, suite => suite.Id)
                    : query.SortedBy(suite => suite.CreatedAt, request.SortDir, suite => suite.Id);

            return await sorted
                .Select(TestSuiteResponse.Projection)
                .ToPaginatedAsync(request.ToPagination(), cancellationToken);
        }
    }
}
