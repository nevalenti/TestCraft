using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestResults;

public static class CreateTestResult
{
    /// <summary>Records a test result for a known test case.</summary>
    public sealed record Command : IRequest<TestResultResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to record the result against.</summary>
        [JsonIgnore]
        public TestRunId RunId { get; init; }

        /// <summary>The test case that was executed.</summary>
        public required TestCaseId TestCaseId { get; init; }

        /// <summary>The result status.</summary>
        public required TestResultStatus Status { get; init; }

        /// <summary>Free-form notes, e.g. a failure message.</summary>
        public string? Notes { get; init; }

        /// <summary>How long the test took to execute, in milliseconds.</summary>
        public long? DurationMs { get; init; }

        /// <summary>The category of defect, when the result failed.</summary>
        public DefectType? DefectType { get; init; }

        /// <summary>When the test was executed.</summary>
        public required DateTimeOffset ExecutedAt { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.TestCaseId).NotEmptyId();
            RuleFor(command => command.Status).IsInEnum();
            RuleFor(command => command.Status).NotEqual(TestResultStatus.Untested);
            RuleFor(command => command.Notes).MaximumLength(5000);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICacheService cache,
        ICurrentUser currentUser,
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
                    existingRun =>
                        existingRun.Id == request.RunId
                        && existingRun.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            run.EnsureCanAddResult();

            var caseExists = await context.TestCases.AnyAsync(
                testCase =>
                    testCase.Id == request.TestCaseId
                    && testCase.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!caseExists)
            {
                throw new NotFoundException();
            }

            var result = await context.TestResults.FirstOrDefaultAsync(
                existingResult =>
                    existingResult.TestRunId == request.RunId
                    && existingResult.TestCaseId == request.TestCaseId
                    && existingResult.Status == TestResultStatus.Untested,
                cancellationToken
            );
            var replacedPlaceholder = result is not null;
            if (result is not null)
            {
                result.Record(
                    request.Status,
                    request.Notes,
                    request.DefectType,
                    request.DurationMs,
                    request.ExecutedAt,
                    currentUser.UserId
                );
            }
            else
            {
                result = TestResult.Create(
                    request.RunId,
                    request.TestCaseId,
                    request.Status,
                    request.Notes,
                    request.DefectType,
                    request.DurationMs,
                    request.ExecutedAt,
                    currentUser.UserId
                );
                context.TestResults.Add(result);
            }

            await context.SaveChangesAsync(cancellationToken);

            var summary = await context
                .LiveResults()
                .Where(createdResult => createdResult.Id == result.Id)
                .Select(TestResultResponse.Projection)
                .FirstAsync(cancellationToken);

            await cache.RemoveAsync(CacheKeys.TestRunResponse(request.RunId), cancellationToken);

            if (replacedPlaceholder)
            {
                await notifier.ResultUpdatedAsync(request.RunId, summary, cancellationToken);
            }
            else
            {
                await notifier.ResultAddedAsync(request.RunId, summary, cancellationToken);
            }

            await notifier.DashboardChangedAsync(
                request.ProjectId,
                request.RunId,
                cancellationToken
            );

            return summary;
        }
    }
}
