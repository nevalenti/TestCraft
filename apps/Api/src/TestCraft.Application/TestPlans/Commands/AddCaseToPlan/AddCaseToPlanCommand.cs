using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestPlans.Commands.AddCaseToPlan;

public record AddCaseToPlanCommand : IRequest, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid TestPlanId { get; init; }
    public required Guid TestCaseId { get; init; }
}

public class AddCaseToPlanCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddCaseToPlanCommand>
{
    public async Task Handle(AddCaseToPlanCommand request, CancellationToken cancellationToken)
    {
        var planExists = await context.TestPlans.AnyAsync(
            p => p.Id == request.TestPlanId && p.ProjectId == request.ProjectId,
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
