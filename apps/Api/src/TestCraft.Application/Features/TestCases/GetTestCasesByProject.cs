using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCases;

public static class GetTestCasesByProject
{
    public sealed record Query
        : TestCaseListQuery,
            IRequest<Paginated<TestCaseResponse>>,
            IProjectScopedRequest
    {
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
