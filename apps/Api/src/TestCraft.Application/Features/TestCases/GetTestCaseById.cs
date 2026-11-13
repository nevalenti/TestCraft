using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCases;

public static class GetTestCaseById
{
    public sealed record Query : IRequest<TestCaseResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        public required ProjectId ProjectId { get; init; }

        /// <summary>The suite the test case belongs to.</summary>
        public required TestSuiteId SuiteId { get; init; }

        public required TestCaseId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestCaseResponse>
    {
        public async Task<TestCaseResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestCases.Where(testCase =>
                    testCase.Id == request.Id
                    && testCase.SuiteId == request.SuiteId
                    && testCase.Suite!.ProjectId == request.ProjectId
                )
                .Select(TestCaseResponse.Projection)
                .FirstOrNotFoundAsync(cancellationToken);
    }
}
