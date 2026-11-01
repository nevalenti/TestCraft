using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestResults;

public static class GetTestResultById
{
    /// <summary>Requests a single test result by id.</summary>
    public sealed record Query : IRequest<TestResultResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public required ProjectId ProjectId { get; init; }

        /// <summary>The run the result belongs to.</summary>
        public required TestRunId RunId { get; init; }

        /// <summary>The result to look up.</summary>
        public required TestResultId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestResultResponse>
    {
        public async Task<TestResultResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .LiveResults()
                .Where(result =>
                    result.Id == request.Id
                    && result.TestRunId == request.RunId
                    && result.TestRun!.ProjectId == request.ProjectId
                )
                .Select(TestResultResponse.Projection)
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
