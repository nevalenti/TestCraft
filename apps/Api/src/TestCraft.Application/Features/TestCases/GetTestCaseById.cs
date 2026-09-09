using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCases;

public static class GetTestCaseById
{
    /// <summary>Requests a single test case by id.</summary>
    public sealed record Query : IRequest<TestCaseResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        public required ProjectId ProjectId { get; init; }

        /// <summary>The suite the test case belongs to.</summary>
        public required TestSuiteId SuiteId { get; init; }

        /// <summary>The test case to look up.</summary>
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
                .ToTestCaseResponse()
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
