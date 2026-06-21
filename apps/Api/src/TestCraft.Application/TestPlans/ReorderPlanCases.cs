using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans;

public static class ReorderPlanCases
{
    public sealed record PlanCaseOrder(Guid TestCaseId, int Order);

    public sealed record Command : IRequest, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid TestPlanId { get; init; }
        public required IReadOnlyList<PlanCaseOrder> Cases { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var planExists = await context.TestPlans.AnyAsync(
                p => p.Id == request.TestPlanId && p.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!planExists)
            {
                throw new NotFoundException();
            }

            var caseIds = request.Cases.Select(c => c.TestCaseId).ToList();
            var entries = await context
                .TestPlanCases.Where(tpc =>
                    tpc.TestPlanId == request.TestPlanId && caseIds.Contains(tpc.TestCaseId)
                )
                .ToListAsync(cancellationToken);

            var orderMap = request.Cases.ToDictionary(c => c.TestCaseId, c => c.Order);
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
