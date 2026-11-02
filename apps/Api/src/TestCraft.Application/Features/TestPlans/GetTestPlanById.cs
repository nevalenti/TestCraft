using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestPlans;

public static class GetTestPlanById
{
    /// <summary>Requests a single test plan, including its ordered test cases.</summary>
    public sealed record Query : IRequest<TestPlanDetailResponse>, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        public ProjectId ProjectId { get; init; }

        /// <summary>The plan to look up.</summary>
        public required TestPlanId Id { get; init; }
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
                    .TestPlans.Where(plan =>
                        plan.Id == request.Id && plan.ProjectId == request.ProjectId
                    )
                    .Select(TestPlanDetailResponse.Projection)
                    .FirstOrDefaultAsync(cancellationToken)
                ?? throw new NotFoundException();
        }
    }
}
