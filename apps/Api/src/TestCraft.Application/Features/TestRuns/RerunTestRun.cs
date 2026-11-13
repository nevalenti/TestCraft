using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Application.Features.TestRuns;

public static class RerunTestRun
{
    /// <summary>Creates a new run seeded with the test cases of an existing run, in Untested status.</summary>
    public sealed record Command : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestRunId Id { get; init; }

        /// <summary>The name to give the new run. Defaults to "Rerun of" and the original name.</summary>
        public string? Name { get; init; }

        /// <summary>The environment to record on the new run. Defaults to the original run's.</summary>
        public string? Environment { get; init; }

        /// <summary>Whether to include only the cases whose current result is failed or blocked.</summary>
        public bool FailedOnly { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name)
                .RequiredName()
                .When(command => command.Name is not null);
            RuleFor(command => command.Environment)
                .RequiredName()
                .When(command => command.Environment is not null);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        ITestRunNotifier notifier
    ) : IRequestHandler<Command, TestRunResponse>
    {
        private const string NamePrefix = "Rerun of ";

        public async Task<TestRunResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var source = await context.TestRuns.FirstOrNotFoundAsync(
                existingRun =>
                    existingRun.Id == request.Id && existingRun.ProjectId == request.ProjectId,
                cancellationToken
            );

            var outcomes = context
                .TestResults.Where(result =>
                    result.TestRunId == source.Id && result.TestCase != null
                )
                .CurrentOutcomes();

            if (request.FailedOnly)
            {
                outcomes = outcomes.Where(result =>
                    result.Status == TestResultStatus.Failed
                    || result.Status == TestResultStatus.Blocked
                );
            }

            var caseIds = await outcomes
                .OrderBy(result => result.CreatedAt)
                .ThenBy(result => result.Id)
                .Select(result => result.TestCaseId)
                .ToListAsync(cancellationToken);

            if (caseIds.Count == 0)
            {
                throw new ConflictException(
                    request.FailedOnly
                        ? "The run has no failed or blocked results to rerun"
                        : "The run has no test cases to rerun",
                    DomainErrorCodes.NothingToRerun
                );
            }

            var run = TestRun.Create(
                request.ProjectId,
                request.Name ?? DefaultName(source.Name),
                request.Environment ?? source.Environment,
                executedById: currentUser.UserId,
                executedByName: currentUser.UserName
            );

            context.TestRuns.Add(run);

            foreach (var caseId in caseIds)
            {
                context.TestResults.Add(
                    TestResult.Create(
                        run.Id,
                        caseId,
                        TestResultStatus.Untested,
                        notes: null,
                        defectType: null,
                        durationMs: null,
                        executedAt: null,
                        executedById: null
                    )
                );
            }

            await context.SaveChangesAsync(cancellationToken);
            await notifier.DashboardChangedAsync(run.ProjectId, run.Id, cancellationToken);

            return TestRunResponse.FromEntity(run);
        }

        private static string DefaultName(string sourceName) =>
            (NamePrefix + sourceName)[
                ..Math.Min(FieldLengths.Name, NamePrefix.Length + sourceName.Length)
            ];
    }
}
