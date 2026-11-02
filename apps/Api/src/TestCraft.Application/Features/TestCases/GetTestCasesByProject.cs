using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCases;

public static class GetTestCasesByProject
{
    /// <summary>Lists test cases across all suites in a project; search matches the case name.</summary>
    public sealed record Query
        : TestCaseListQuery,
            IRequest<Paginated<TestCaseResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list test cases for.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestCaseResponse>>
    {
        public Task<Paginated<TestCaseResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            request.ToPageAsync(
                context.TestCases.Where(testCase => testCase.Suite!.ProjectId == request.ProjectId),
                cancellationToken
            );
    }
}
