using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestPlans;

public static class ReorderPlanCases
{
    /// <summary>The new position for a single test case within a plan.</summary>
    public sealed record PlanCaseOrder(Guid TestCaseId, int Order);

    /// <summary>Reorders the test cases within a plan.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The plan whose test cases are being reordered.</summary>
        public required Guid TestPlanId { get; init; }

        /// <summary>The new order for the given test cases.</summary>
        public required IReadOnlyList<PlanCaseOrder> Cases { get; init; }
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

            var caseIds = request.Cases.Select(caseOrder => caseOrder.TestCaseId).ToList();
            var entries = await context
                .TestPlanCases.Where(tpc =>
                    tpc.TestPlanId == request.TestPlanId && caseIds.Contains(tpc.TestCaseId)
                )
                .ToListAsync(cancellationToken);

            var orderMap = request.Cases.ToDictionary(
                caseOrder => caseOrder.TestCaseId,
                caseOrder => caseOrder.Order
            );
            foreach (var entry in entries)
            {
                if (orderMap.TryGetValue(entry.TestCaseId, out var newOrder))
                {
                    entry.Order = newOrder;
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
