using FluentValidation;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestPlans;

public static class CreateRunFromPlan
{
    /// <summary>Creates a new run seeded with all test cases in a plan, in Blocked status.</summary>
    public sealed record Command : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The plan to create the run from.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public TestPlanId TestPlanId { get; init; }

        /// <summary>The name to give the created run.</summary>
        public required string Name { get; init; }

        /// <summary>The environment label to record on the run.</summary>
        public required string Environment { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).NotEmpty().MaximumLength(255);
            RuleFor(command => command.Environment).NotEmpty().MaximumLength(100);
        }
    }

    public sealed class Handler(IApplicationDbContext context, ICurrentUser currentUser)
        : IRequestHandler<Command, TestRunResponse>
    {
        public async Task<TestRunResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var plan =
                await context.TestPlans.FirstOrDefaultAsync(
                    existingPlan =>
                        existingPlan.Id == request.TestPlanId
                        && existingPlan.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            var cases = await context
                .TestPlanCases.Where(tpc => tpc.TestPlanId == plan.Id && tpc.TestCase != null)
                .OrderBy(tpc => tpc.Order)
                .Select(tpc => tpc.TestCaseId)
                .ToListAsync(cancellationToken);

            var now = DateTimeOffset.UtcNow;
            var run = new TestRun
            {
                Id = TestRunId.New(),
                ProjectId = request.ProjectId,
                Name = request.Name,
                Environment = request.Environment,
                ExecutedById = currentUser.UserId,
                ExecutedByName = currentUser.UserName,
            };

            context.TestRuns.Add(run);
            await context.SaveChangesAsync(cancellationToken);

            foreach (var caseId in cases)
            {
                context.TestResults.Add(
                    new TestResult
                    {
                        Id = TestResultId.New(),
                        TestRunId = run.Id,
                        TestCaseId = caseId,
                        Status = TestResultStatus.Blocked,
                        ExecutedAt = now,
                        ExecutedById = currentUser.UserId,
                    }
                );
            }

            await context.SaveChangesAsync(cancellationToken);

            return TestRunResponse.FromEntity(run);
        }
    }
}
