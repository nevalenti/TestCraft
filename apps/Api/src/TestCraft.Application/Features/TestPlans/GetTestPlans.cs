using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestPlans;

public static class GetTestPlans
{
    /// <summary>Lists the test plans in a project.</summary>
    public sealed record Query : IRequest<IReadOnlyList<TestPlanResponse>>, IProjectScopedRequest
    {
        /// <summary>The project to list plans for.</summary>
        public Guid ProjectId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<TestPlanResponse>>
    {
        public async Task<IReadOnlyList<TestPlanResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            return await context
                .TestPlans.Where(plan => plan.ProjectId == request.ProjectId)
                .OrderByDescending(plan => plan.CreatedAt)
                .Select(plan => new TestPlanResponse
                {
                    Id = plan.Id,
                    Name = plan.Name,
                    Description = plan.Description,
                    ProjectId = plan.ProjectId,
                    CaseCount = plan.TestPlanCases.Count(tpc =>
                        tpc.TestCase != null && !tpc.TestCase.IsDeleted
                    ),
                    CreatedAt = plan.CreatedAt,
                })
                .ToListAsync(cancellationToken);
        }
    }
}
