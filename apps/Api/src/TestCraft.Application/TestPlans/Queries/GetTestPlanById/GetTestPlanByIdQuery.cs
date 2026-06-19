using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans.Queries.GetTestPlanById;

public record GetTestPlanByIdQuery : IRequest<TestPlanDetailResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class GetTestPlanByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTestPlanByIdQuery, TestPlanDetailResponse>
{
    public async Task<TestPlanDetailResponse> Handle(
        GetTestPlanByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        var plan =
            await context
                .TestPlans.Where(p => p.Id == request.Id && p.ProjectId == request.ProjectId)
                .Select(p => new TestPlanDetailResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    ProjectId = p.ProjectId,
                    CreatedAt = p.CreatedAt,
                    Cases = p
                        .TestPlanCases.Where(tpc => tpc.TestCase != null && !tpc.TestCase.IsDeleted)
                        .OrderBy(tpc => tpc.Order)
                        .Select(tpc => new TestPlanCaseResponse
                        {
                            TestCaseId = tpc.TestCaseId,
                            TestCaseName = tpc.TestCase!.Name,
                            SuiteName = tpc.TestCase.Suite!.Name,
                            Order = tpc.Order,
                        })
                        .ToList(),
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();

        return plan;
    }
}
