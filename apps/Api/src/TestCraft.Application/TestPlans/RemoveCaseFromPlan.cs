using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans;

public static class RemoveCaseFromPlan
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid TestPlanId { get; init; }
        public required Guid TestCaseId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var entry = await context.TestPlanCases.FirstOrDefaultAsync(
                tpc => tpc.TestPlanId == request.TestPlanId && tpc.TestCaseId == request.TestCaseId,
                cancellationToken
            );

            if (entry is null)
            {
                return;
            }

            context.TestPlanCases.Remove(entry);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
