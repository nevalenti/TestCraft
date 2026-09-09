using FluentValidation;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Contracts.Catalog;
using TestCraft.Modules.TestExecution.Application;
using TestCraft.Application.Common.Security;
using TestCraft.Modules.TestExecution.Domain.Entities;
using TestCraft.Modules.TestExecution.Domain.Enums;

namespace TestCraft.Modules.TestExecution.Application.Features.TestResults;

public static class CreateTestResultByName
{
    /// <summary>
    /// Records a test result by suite/case name, creating the suite and test case if they
    /// don't already exist. Used by CI reporters importing results without known ids.
    /// </summary>
    public sealed record Command : IRequest<TestResultResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to record the result against.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public TestRunId RunId { get; init; }

        /// <summary>The suite name, created if it doesn't already exist.</summary>
        public required string SuiteName { get; init; }

        /// <summary>The test case name, created if it doesn't already exist.</summary>
        public required string TestCaseName { get; init; }

        /// <summary>The result status.</summary>
        public required TestResultStatus Status { get; init; }

        /// <summary>Free-form notes, e.g. a failure message.</summary>
        public string? Notes { get; init; }

        /// <summary>How long the test took to execute, in milliseconds.</summary>
        public long? DurationMs { get; init; }

        /// <summary>Identifies the CI system or tool the result came from.</summary>
        public string? Source { get; init; }

        /// <summary>When the test was executed.</summary>
        public required DateTimeOffset ExecutedAt { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.SuiteName).NotEmpty().MaximumLength(500);
            RuleFor(command => command.TestCaseName).NotEmpty().MaximumLength(500);
            RuleFor(command => command.Status).IsInEnum();
            RuleFor(command => command.Notes).MaximumLength(5000);
        }
    }

    public sealed class Handler(
        ITestExecutionDbContext context,
        ICacheService cache,
        ICurrentUser currentUser,
        ITestRunNotifier notifier,
        ICatalogTestCases catalogTestCases
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

            var testCase = await catalogTestCases.FindOrCreateAsync(
                request.ProjectId,
                request.SuiteName,
                request.TestCaseName,
                request.Source,
                cancellationToken
            );

            var result = new TestResult
            {
                Id = TestResultId.New(),
                TestRunId = request.RunId,
                TestCaseId = testCase.Id,
                SuiteId = testCase.SuiteId,
                TestCaseName = testCase.Name,
                Status = request.Status,
                Notes = request.Notes,
                DurationMs = request.DurationMs,
                ExecutedAt = request.ExecutedAt,
                ExecutedById = currentUser.UserId,
            };

            context.TestResults.Add(result);

            await context.SaveChangesAsync(cancellationToken);

            var summary = await context
                .TestResults.Where(createdResult => createdResult.Id == result.Id)
                .Select(createdResult => new TestResultResponse
                {
                    Id = createdResult.Id,
                    TestRunId = createdResult.TestRunId,
                    TestCaseId = createdResult.TestCaseId,
                    SuiteId = createdResult.SuiteId,
                    TestCaseName = createdResult.TestCaseName,
                    Status = createdResult.Status,
                    Notes = createdResult.Notes,
                    DurationMs = createdResult.DurationMs,
                    DefectType = createdResult.DefectType,
                    ExecutedAt = createdResult.ExecutedAt,
                    ExecutedById = createdResult.ExecutedById,
                    CreatedAt = createdResult.CreatedAt,
                    UpdatedAt = createdResult.UpdatedAt,
                })
                .FirstAsync(cancellationToken);

            await cache.RemoveAsync(CacheKeys.TestRunResponse(request.RunId), cancellationToken);

            await notifier.ResultAddedAsync(request.RunId, summary, cancellationToken);

            return summary;
        }
    }
}
