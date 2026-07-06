using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestResults;

public static class UpdateTestResult
{
    /// <summary>Updates a test result's status, notes, and defect type.</summary>
    public sealed record Command : IRequest<TestResultResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The run the result belongs to.</summary>
        public Guid RunId { get; init; }

        /// <summary>The result to update.</summary>
        public Guid Id { get; init; }

        /// <summary>The result's new status.</summary>
        public required TestResultStatus Status { get; init; }

        /// <summary>Free-form notes, e.g. a failure message.</summary>
        public string? Notes { get; init; }

        /// <summary>The category of defect, when the result failed.</summary>
        public DefectType? DefectType { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Status).IsInEnum();
            RuleFor(x => x.Notes).MaximumLength(5000);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICacheService cache,
        ITestRunNotifier notifier
    ) : IRequestHandler<Command, TestResultResponse>
    {
        public async Task<TestResultResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var run =
                await context.TestRuns.FirstOrDefaultAsync(
                    r => r.Id == request.RunId && r.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            run.EnsureCanAddResult();

            var result =
                await context.TestResults.FirstOrDefaultAsync(
                    r => r.Id == request.Id && r.TestRunId == request.RunId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            result.Update(request.Status, request.Notes, request.DefectType);

            await context.SaveChangesAsync(cancellationToken);
            await cache.RemoveAsync(CacheKeys.TestRunResponse(request.RunId), cancellationToken);

            var summary = await context
                .TestResults.Where(r => r.Id == result.Id)
                .Select(r => new TestResultResponse
                {
                    Id = r.Id,
                    TestRunId = r.TestRunId,
                    TestCaseId = r.TestCaseId,
                    SuiteId = r.TestCase!.SuiteId,
                    TestCaseName = r.TestCase.Name,
                    Status = r.Status,
                    Notes = r.Notes,
                    DurationMs = r.DurationMs,
                    DefectType = r.DefectType,
                    ExecutedAt = r.ExecutedAt,
                    ExecutedById = r.ExecutedById,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                })
                .FirstAsync(cancellationToken);

            await notifier.ResultUpdatedAsync(request.RunId, summary, cancellationToken);

            return summary;
        }
    }
}
