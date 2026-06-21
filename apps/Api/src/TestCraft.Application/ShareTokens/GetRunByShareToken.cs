using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.ShareTokens;

public record SharedRunResponse(
    string RunName,
    string Environment,
    string Status,
    DateTimeOffset CreatedAt,
    int Total,
    int Passed,
    int Failed,
    int Blocked,
    int Skipped,
    double PassRate,
    IReadOnlyList<SharedResultItem> Results
);

public record SharedResultItem(
    string TestCaseName,
    string Status,
    string? Notes,
    long? DurationMs,
    DateTimeOffset ExecutedAt
);

public static class GetRunByShareToken
{
    public sealed record Query(string Token) : IRequest<SharedRunResponse>;

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, SharedRunResponse>
    {
        public async Task<SharedRunResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var shareToken = await context.ShareTokens.FirstOrDefaultAsync(
                st => st.Token == request.Token,
                cancellationToken
            );

            if (
                shareToken is null
                || (shareToken.ExpiresAt.HasValue && shareToken.ExpiresAt < DateTimeOffset.UtcNow)
            )
            {
                throw new NotFoundException();
            }

            var run =
                await context.TestRuns.FirstOrDefaultAsync(
                    r => r.Id == shareToken.TestRunId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            var results = await context
                .TestResults.Where(r => r.TestRunId == run.Id)
                .Select(r => new SharedResultItem(
                    r.TestCase!.Name,
                    r.Status.ToString(),
                    r.Notes,
                    r.DurationMs,
                    r.ExecutedAt
                ))
                .ToListAsync(cancellationToken);

            var counts = results.GroupBy(r => r.Status).ToDictionary(g => g.Key, g => g.Count());

            var passed = counts.GetValueOrDefault(TestResultStatus.Passed.ToString(), 0);
            var failed = counts.GetValueOrDefault(TestResultStatus.Failed.ToString(), 0);
            var blocked = counts.GetValueOrDefault(TestResultStatus.Blocked.ToString(), 0);
            var skipped = counts.GetValueOrDefault(TestResultStatus.Skipped.ToString(), 0);
            var total = passed + failed + blocked + skipped;
            var passRate = total > 0 ? Math.Round(passed * 100.0 / total, 1) : 0;

            return new SharedRunResponse(
                run.Name,
                run.Environment,
                run.Status.ToString(),
                run.CreatedAt,
                total,
                passed,
                failed,
                blocked,
                skipped,
                passRate,
                results
            );
        }
    }
}
