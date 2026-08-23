using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestRuns;

public static class GetRunLogs
{
    /// <summary>Requests a run's log lines, in order.</summary>
    public sealed record Query : IRequest<IReadOnlyList<string>>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to fetch logs for.</summary>
        public TestRunId RunId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<string>>
    {
        public async Task<IReadOnlyList<string>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var exists = await context.TestRuns.AnyAsync(
                run => run.Id == request.RunId && run.ProjectId == request.ProjectId,
                cancellationToken
            );

            if (!exists)
                throw new NotFoundException();

            return await context
                .RunLogs.Where(log => log.RunId == request.RunId)
                .OrderBy(log => log.CreatedAt)
                .Select(log => log.Message)
                .ToListAsync(cancellationToken);
        }
    }
}
