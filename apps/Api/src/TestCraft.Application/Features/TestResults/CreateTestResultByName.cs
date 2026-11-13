using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestResults;

public static class CreateTestResultByName
{
    /// <summary>
    /// Records a test result by suite/case name, creating the suite and test case if they
    /// don't already exist. Used by CI reporters importing results without known ids.
    /// </summary>
    public sealed record Command : IRequest<TestResultResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
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
            RuleFor(command => command.Status).NotEqual(TestResultStatus.Untested);
            RuleFor(command => command.Notes).MaximumLength(FieldLengths.Notes);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        IDbExceptionClassifier dbExceptionClassifier,
        TestResultRecorder recorder
    ) : IRequestHandler<Command, TestResultResponse>
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

            var suite = await context.GetOrCreateAsync(
                context.TestSuites,
                existingSuite =>
                    existingSuite.ProjectId == request.ProjectId
                    && existingSuite.Name == request.SuiteName,
                () =>
                    TestSuite.Create(request.ProjectId, request.SuiteName, source: request.Source),
                dbExceptionClassifier,
                cancellationToken
            );

            var testCase = await context.GetOrCreateAsync(
                context.TestCases,
                existingCase =>
                    existingCase.SuiteId == suite.Id && existingCase.Name == request.TestCaseName,
                () => TestCase.Create(suite.Id, request.TestCaseName),
                dbExceptionClassifier,
                cancellationToken
            );

            return await recorder.RecordAsync(
                request.ProjectId,
                request.RunId,
                testCase.Id,
                new RecordedOutcome(
                    request.Status,
                    request.Notes,
                    request.DurationMs,
                    request.ExecutedAt
                ),
                cancellationToken
            );
        }
    }
}
