using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCaseSteps;

public static class GetTestCaseSteps
{
    /// <summary>Lists the steps of a test case, in order.</summary>
    public sealed record Query
        : PageQuery,
            IRequest<Paginated<TestCaseStepResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project the test case belongs to.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        /// <summary>The test case to list steps for.</summary>
        [RouteValue]
        public TestCaseId CaseId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestCaseStepResponse>>
    {
        public async Task<Paginated<TestCaseStepResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.TestCaseSteps.Where(step =>
                step.TestCaseId == request.CaseId
                && step.TestCase!.Suite!.ProjectId == request.ProjectId
            );

            return await query
                .OrderBy(step => step.Order)
                .ThenBy(step => step.Id)
                .Select(TestCaseStepResponse.Projection)
                .ToPaginatedAsync(request.ToPagination(), cancellationToken);
        }
    }
}
