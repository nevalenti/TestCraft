using AutoMapper;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.TestRuns;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestPlans.Commands.CreateRunFromPlan;

public record CreateRunFromPlanCommand : IRequest<TestRunResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid TestPlanId { get; init; }
    public required string Name { get; init; }
    public required string Environment { get; init; }
}

public class CreateRunFromPlanCommandValidator : AbstractValidator<CreateRunFromPlanCommand>
{
    public CreateRunFromPlanCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Environment).NotEmpty().MaximumLength(100);
    }
}

public class CreateRunFromPlanCommandHandler(
    IApplicationDbContext context,
    ICurrentUser currentUser,
    IMapper mapper
) : IRequestHandler<CreateRunFromPlanCommand, TestRunResponse>
{
    public async Task<TestRunResponse> Handle(
        CreateRunFromPlanCommand request,
        CancellationToken cancellationToken
    )
    {
        var plan =
            await context.TestPlans.FirstOrDefaultAsync(
                p => p.Id == request.TestPlanId && p.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        var cases = await context
            .TestPlanCases.Where(tpc =>
                tpc.TestPlanId == plan.Id && tpc.TestCase != null && !tpc.TestCase.IsDeleted
            )
            .OrderBy(tpc => tpc.Order)
            .Select(tpc => tpc.TestCaseId)
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var run = new TestRun
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            Environment = request.Environment,
            Status = TestRunStatus.Active,
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

        return mapper.Map<TestRunResponse>(run);
    }
}
