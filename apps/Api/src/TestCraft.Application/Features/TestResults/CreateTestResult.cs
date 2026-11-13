using FluentValidation;
using MediatR;
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

        /// <summary>A link to the issue tracking the defect, when the result failed.</summary>
        public string? DefectUrl { get; init; }

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
            RuleFor(command => command.Notes).MaximumLength(FieldLengths.Notes);
            RuleFor(command => command.DefectUrl).HttpUrl();
        }
    }

    public sealed class Handler(IApplicationDbContext context, TestResultRecorder recorder)
        : IRequestHandler<Command, TestResultResponse>
    {
        public async Task<TestResultResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var run = await context.TestRuns.FirstOrNotFoundAsync(
                existingRun =>
                    existingRun.Id == request.RunId && existingRun.ProjectId == request.ProjectId,
                cancellationToken
            );

            run.EnsureCanAddResult();

            await context.TestCases.EnsureExistsAsync(
                testCase =>
                    testCase.Id == request.TestCaseId
                    && testCase.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );

            return await recorder.RecordAsync(
                request.ProjectId,
                request.RunId,
                request.TestCaseId,
                new RecordedOutcome(
                    request.Status,
                    request.Notes,
                    request.DurationMs,
                    request.ExecutedAt,
                    request.DefectType,
                    request.DefectUrl
                ),
                cancellationToken
            );
        }
    }
}
