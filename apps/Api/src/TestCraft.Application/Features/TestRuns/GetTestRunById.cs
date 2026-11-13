using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestRuns;

public static class GetTestRunById
{
    public sealed record Query : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public required ProjectId ProjectId { get; init; }

        public required TestRunId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestRunResponse>
    {
        public async Task<TestRunResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestRuns.Where(run => run.Id == request.Id && run.ProjectId == request.ProjectId)
                .Select(TestRunResponse.Projection)
                .FirstOrNotFoundAsync(cancellationToken);
    }
}
