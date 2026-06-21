using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.TestRuns;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestPlans;

public static class CreateRunFromPlan
{
    public sealed record Command : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid TestPlanId { get; init; }
        public required string Name { get; init; }
        public required string Environment { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
            RuleFor(x => x.Environment).NotEmpty().MaximumLength(100);
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
                    p => p.Id == request.TestPlanId && p.ProjectId == request.ProjectId,
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
                ProjectId = request.ProjectId,
                Name = request.Name,
                Environment = request.Environment,
                ExecutedById = currentUser.UserId,
            };

            context.TestRuns.Add(run);
            await context.SaveChangesAsync(cancellationToken);

            foreach (var caseId in cases)
            {
                context.TestResults.Add(
                    new TestResult
                    {
                        TestRunId = run.Id,
                        TestCaseId = caseId,
                        Status = TestResultStatus.Blocked,
                        ExecutedAt = now,
                        ExecutedById = currentUser.UserId,
                    }
                );
            }

            await context.SaveChangesAsync(cancellationToken);

            return new TestRunResponse
            {
                Id = run.Id,
                ProjectId = run.ProjectId,
                Name = run.Name,
                Environment = run.Environment,
                Status = run.Status,
                Source = run.Source,
                ExecutedById = run.ExecutedById,
                CreatedAt = run.CreatedAt,
                UpdatedAt = run.UpdatedAt,
            };
        }
    }
}
