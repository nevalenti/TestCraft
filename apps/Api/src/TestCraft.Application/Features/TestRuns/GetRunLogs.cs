using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestRuns;

/// <summary>One log line of a run.</summary>
public sealed record RunLogLineResponse
{
    /// <summary>Position of the line in the run's log; pass it as <c>before_seq</c> to page back.</summary>
    public required long Seq { get; init; }

    public required string Message { get; init; }
}

/// <summary>A page of a run's log lines, oldest first.</summary>
public sealed record RunLogPageResponse
{
    public required IReadOnlyList<RunLogLineResponse> Items { get; init; }

    /// <summary>Whether older lines exist.</summary>
    public required bool HasMore { get; init; }
}

public static class GetRunLogs
{
    public const int DefaultLimit = 1000;
    public const int MaxLimit = 5000;

    /// <summary>Requests the newest log lines, optionally only those older than a line.</summary>
    public sealed record Query : IRequest<RunLogPageResponse>, IProjectScopedRequest
    {
        public ProjectId ProjectId { get; init; }

        public TestRunId RunId { get; init; }

        public long? BeforeSeq { get; init; }

        public int Limit { get; init; } = DefaultLimit;
    }

    public sealed class Validator : AbstractValidator<Query>
    {
        public Validator()
        {
            RuleFor(query => query.BeforeSeq).GreaterThanOrEqualTo(1);
            RuleFor(query => query.Limit).InclusiveBetween(1, MaxLimit);
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, RunLogPageResponse>
    {
        public async Task<RunLogPageResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var runExists = await context.TestRuns.AnyAsync(
                run => run.Id == request.RunId && run.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!runExists)
            {
                throw new NotFoundException();
            }

            var logs = context.RunLogs.AsNoTracking().Where(log => log.RunId == request.RunId);
            if (request.BeforeSeq is { } beforeSeq)
            {
                logs = logs.Where(log => log.Seq < beforeSeq);
            }

            var newestFirst = await logs.OrderByDescending(log => log.Seq)
                .Take(request.Limit + 1)
                .Select(log => new RunLogLineResponse { Seq = log.Seq, Message = log.Message })
                .ToListAsync(cancellationToken);

            return new RunLogPageResponse
            {
                Items = newestFirst.Take(request.Limit).Reverse().ToList(),
                HasMore = newestFirst.Count > request.Limit,
            };
        }
    }
}
