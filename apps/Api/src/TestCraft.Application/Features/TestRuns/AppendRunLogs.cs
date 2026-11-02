using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestRuns;

public static class AppendRunLogs
{
    /// <summary>Appends log lines to a run's live log feed.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to append logs to.</summary>
        [JsonIgnore]
        public TestRunId RunId { get; init; }

        /// <summary>The log lines to append, in order.</summary>
        public required IReadOnlyList<string> Lines { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Lines)
                .Must(lines => lines.Count <= 1000)
                .WithMessage("A maximum of 1000 log lines can be appended per request");
            RuleForEach(command => command.Lines).MaximumLength(10_000);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        IRunLogWriter runLogs,
        ITestRunNotifier notifier
    ) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var run =
                await context.TestRuns.FirstOrDefaultAsync(
                    existingRun =>
                        existingRun.Id == request.RunId
                        && existingRun.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            if (request.Lines.Count == 0)
            {
                return;
            }

            run.EnsureCanAddResult();

            var lastSeq = await runLogs.AppendAsync(
                request.RunId,
                request.Lines,
                cancellationToken
            );

            await notifier.LogsAppendedAsync(
                request.RunId,
                request.Lines,
                lastSeq,
                cancellationToken
            );
        }
    }
}
