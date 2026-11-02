using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCases;

public static class GetTestCases
{
    /// <summary>Lists test cases within a suite; search matches the case name.</summary>
    public sealed record Query
        : TestCaseListQuery,
            IRequest<Paginated<TestCaseResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite to list test cases for.</summary>
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
            var suiteExists = await context.TestSuites.AnyAsync(
                suite => suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!suiteExists)
            {
                throw new NotFoundException();
            }

            return await request.ToPageAsync(
                context.TestCases.Where(testCase => testCase.SuiteId == request.SuiteId),
                cancellationToken
            );
        }
    }
}
