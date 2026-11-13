using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestPlans;

public static class AddCaseToPlan
{
    /// <summary>Adds a test case to a plan, appended to the end of the ordering.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestPlanId TestPlanId { get; init; }

        /// <summary>The test case to add.</summary>
        public required TestCaseId TestCaseId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, TimeProvider timeProvider)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            await context.TestPlans.EnsureExistsAsync(
                plan => plan.Id == request.TestPlanId && plan.ProjectId == request.ProjectId,
                cancellationToken
            );

            await context.TestCases.EnsureExistsAsync(
                tc => tc.Id == request.TestCaseId && tc.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );

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
                TestPlanCase.Create(request.TestPlanId, request.TestCaseId, (maxOrder ?? 0) + 1)
            );

            await context.SaveChangesAsync(cancellationToken);
            await context.TouchPlanAsync(
                request.TestPlanId,
                timeProvider.GetStoredUtcNow(),
                cancellationToken
            );
        }
    }
}
