using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestResults;

public static class GetTestResultById
{
    public sealed record Query : IRequest<TestResultResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public required ProjectId ProjectId { get; init; }

        public required TestRunId RunId { get; init; }

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
                .FirstOrNotFoundAsync(cancellationToken);
    }
}
