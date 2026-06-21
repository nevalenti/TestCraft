using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans;

public static class GetTestPlanById
{
    public sealed record Query : IRequest<TestPlanDetailResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestPlanDetailResponse>
    {
        public async Task<TestPlanDetailResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            return await context
                    .TestPlans.Where(p => p.Id == request.Id && p.ProjectId == request.ProjectId)
                    .Select(p => new TestPlanDetailResponse
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        ProjectId = p.ProjectId,
                        CreatedAt = p.CreatedAt,
                        Cases = p
                            .TestPlanCases.Where(tpc => tpc.TestCase != null)
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
        }
    }
}
