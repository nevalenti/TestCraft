using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestRuns;

public static class AppendRunLogs
{
    /// <summary>Appends log lines to a run's live log feed.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The run to append logs to.</summary>
        public Guid RunId { get; init; }

        /// <summary>The log lines to append, in order.</summary>
        public required IReadOnlyList<string> Lines { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, ITestRunNotifier notifier)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var exists = await context.TestRuns.AnyAsync(
                run => run.Id == request.RunId && run.ProjectId == request.ProjectId,
                cancellationToken
            );

            if (!exists)
                throw new NotFoundException();

            if (request.Lines.Count == 0)
                return;

            var entries = request
                .Lines.Select(line => new RunLog { RunId = request.RunId, Message = line })
                .ToList();

            context.RunLogs.AddRange(entries);
            await context.SaveChangesAsync(cancellationToken);

            await notifier.LogsAppendedAsync(request.RunId, request.Lines, cancellationToken);
        }
    }
}
