using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans.Queries.GetTestPlanCases;

public record GetTestPlanCasesQuery
    : IRequest<IReadOnlyList<TestPlanCaseResponse>>,
        IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid TestPlanId { get; init; }
}

public class GetTestPlanCasesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTestPlanCasesQuery, IReadOnlyList<TestPlanCaseResponse>>
{
    public async Task<IReadOnlyList<TestPlanCaseResponse>> Handle(
        GetTestPlanCasesQuery request,
        CancellationToken cancellationToken
    )
    {
        var planExists = await context.TestPlans.AnyAsync(
            p => p.Id == request.TestPlanId && p.ProjectId == request.ProjectId,
            cancellationToken
        );

        if (!planExists)
            throw new NotFoundException();

        return await context
            .TestPlanCases.Where(tpc => tpc.TestPlanId == request.TestPlanId)
            .OrderBy(tpc => tpc.Order)
            .Select(tpc => new TestPlanCaseResponse
            {
                TestCaseId = tpc.TestCaseId,
                TestCaseName = tpc.TestCase!.Name,
                SuiteName = tpc.TestCase.Suite!.Name,
                Order = tpc.Order,
            })
            .ToListAsync(cancellationToken);
    }
}
