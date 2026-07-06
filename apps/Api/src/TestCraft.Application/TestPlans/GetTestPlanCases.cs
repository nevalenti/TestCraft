using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans;

public static class GetTestPlanCases
{
    /// <summary>Lists the test cases in a plan, in order.</summary>
    public sealed record Query
        : IRequest<IReadOnlyList<TestPlanCaseResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The plan to list test cases for.</summary>
        public required Guid TestPlanId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<TestPlanCaseResponse>>
    {
        public async Task<IReadOnlyList<TestPlanCaseResponse>> Handle(
            Query request,
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
}
