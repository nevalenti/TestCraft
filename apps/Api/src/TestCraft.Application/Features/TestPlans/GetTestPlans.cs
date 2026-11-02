using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestPlans;

public static class GetTestPlans
{
    public enum SortField
    {
        Name,
        CreatedAt,
    }

    /// <summary>Lists the test plans in a project; search matches the plan name.</summary>
    public sealed record Query
        : SearchPageQuery,
            IRequest<Paginated<TestPlanResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list plans for.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        public SortField SortBy { get; init; } = SortField.CreatedAt;

        public SortDirection SortDir { get; init; } = SortDirection.Desc;
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestPlanResponse>>
    {
        public Task<Paginated<TestPlanResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.TestPlans.Where(plan => plan.ProjectId == request.ProjectId);

            query = query.WhereContainsIgnoringCase(plan => plan.Name, request.Search);

            var sorted =
                request.SortBy == SortField.Name
                    ? query.SortedBy(plan => plan.Name, request.SortDir, plan => plan.Id)
                    : query.SortedBy(plan => plan.CreatedAt, request.SortDir, plan => plan.Id);

            return sorted
                .Select(TestPlanResponse.Projection)
                .ToPaginatedAsync(request.ToPagination(), cancellationToken);
        }
    }
}
