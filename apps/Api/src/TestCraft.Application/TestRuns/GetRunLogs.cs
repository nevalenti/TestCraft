using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestRuns;

public static class GetRunLogs
{
    public sealed record Query : IRequest<IReadOnlyList<string>>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid RunId { get; init; }
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
                r => r.Id == request.RunId && r.ProjectId == request.ProjectId,
                cancellationToken
            );

            if (!exists)
                throw new NotFoundException();

            return await context
                .RunLogs.Where(l => l.RunId == request.RunId)
                .OrderBy(l => l.CreatedAt)
                .Select(l => l.Message)
                .ToListAsync(cancellationToken);
        }
    }
}
