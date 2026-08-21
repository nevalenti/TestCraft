using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestResults;

/// <summary>The outcome of executing one test case within a run.</summary>
public record TestResultResponse
{
    /// <summary>The result's identifier.</summary>
    public required TestResultId Id { get; init; }

    /// <summary>The run this result belongs to.</summary>
    public required TestRunId TestRunId { get; init; }

    /// <summary>The test case that was executed.</summary>
    public required TestCaseId TestCaseId { get; init; }

    /// <summary>The suite the test case belongs to.</summary>
    public required TestSuiteId SuiteId { get; init; }

    /// <summary>The test case's name, denormalized for display.</summary>
    public required string TestCaseName { get; init; }

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

    /// <summary>The user who recorded the result, if any.</summary>
    public UserId? ExecutedById { get; init; }

    /// <summary>When the result was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the result was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}

public static class CreateTestResult
{
    /// <summary>Records a test result for a known test case.</summary>
    public sealed record Command : IRequest<TestResultResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to record the result against.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
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
            RuleFor(command => command.TestCaseId).Must(id => id.Value != Guid.Empty);
            RuleFor(command => command.Status).IsInEnum();
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

            var result = new TestResult
            {
                Id = TestResultId.New(),
                TestRunId = request.RunId,
                TestCaseId = request.TestCaseId,
                Status = request.Status,
                Notes = request.Notes,
                DurationMs = request.DurationMs,
                DefectType = request.DefectType,
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
                    SuiteId = createdResult.TestCase!.SuiteId,
                    TestCaseName = createdResult.TestCase.Name,
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
