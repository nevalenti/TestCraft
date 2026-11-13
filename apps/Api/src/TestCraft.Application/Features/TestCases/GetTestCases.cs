using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCases;

public static class GetTestCases
{
    public sealed record Query
        : TestCaseListQuery,
            IRequest<Paginated<TestCaseResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        [RouteValue]
        public TestSuiteId SuiteId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestCaseResponse>>
    {
        public async Task<Paginated<TestCaseResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            await context.TestSuites.EnsureExistsAsync(
                suite => suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                cancellationToken
            );

            return await request.ToPageAsync(
                context.TestCases.Where(testCase => testCase.SuiteId == request.SuiteId),
                cancellationToken
            );
        }
    }
}
