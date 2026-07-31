using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestPlans;

public static class AddCaseToPlan
{
    /// <summary>Adds a test case to a plan, appended to the end of the ordering.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The plan to add the test case to.</summary>
        public required Guid TestPlanId { get; init; }

        /// <summary>The test case to add.</summary>
        public required Guid TestCaseId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var planExists = await context.TestPlans.AnyAsync(
                plan => plan.Id == request.TestPlanId && plan.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!planExists)
            {
                throw new NotFoundException();
            }

            var caseExists = await context.TestCases.AnyAsync(
                tc => tc.Id == request.TestCaseId && tc.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!caseExists)
            {
                throw new NotFoundException();
            }

            var alreadyAdded = await context.TestPlanCases.AnyAsync(
                tpc => tpc.TestPlanId == request.TestPlanId && tpc.TestCaseId == request.TestCaseId,
                cancellationToken
            );
            if (alreadyAdded)
            {
                return;
            }

            var maxOrder = await context
                .TestPlanCases.Where(tpc => tpc.TestPlanId == request.TestPlanId)
                .Select(tpc => (int?)tpc.Order)
                .MaxAsync(cancellationToken);

            context.TestPlanCases.Add(
                new TestPlanCase
                {
                    TestPlanId = request.TestPlanId,
                    TestCaseId = request.TestCaseId,
                    Order = (maxOrder ?? 0) + 1,
                }
            );

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
