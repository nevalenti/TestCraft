using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans.Commands.RemoveCaseFromPlan;

public record RemoveCaseFromPlanCommand : IRequest, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid TestPlanId { get; init; }
    public required Guid TestCaseId { get; init; }
}

public class RemoveCaseFromPlanCommandHandler(IApplicationDbContext context)
    : IRequestHandler<RemoveCaseFromPlanCommand>
{
    public async Task Handle(RemoveCaseFromPlanCommand request, CancellationToken cancellationToken)
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
