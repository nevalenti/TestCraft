using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans.Queries.GetTestPlans;

public record GetTestPlansQuery : IRequest<IReadOnlyList<TestPlanResponse>>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
}

public class GetTestPlansQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTestPlansQuery, IReadOnlyList<TestPlanResponse>>
{
    public async Task<IReadOnlyList<TestPlanResponse>> Handle(
        GetTestPlansQuery request,
        CancellationToken cancellationToken
    )
    {
        return await context
            .TestPlans.Where(p => p.ProjectId == request.ProjectId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new TestPlanResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                ProjectId = p.ProjectId,
                CaseCount = p.TestPlanCases.Count(tpc =>
                    tpc.TestCase != null && !tpc.TestCase.IsDeleted
                ),
                CreatedAt = p.CreatedAt,
            })
            .ToListAsync(cancellationToken);
    }
}
