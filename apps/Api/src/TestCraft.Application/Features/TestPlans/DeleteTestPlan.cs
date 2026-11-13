using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestPlans;

public static class DeleteTestPlan
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestPlanId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, TimeProvider timeProvider)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var plan = await context.TestPlans.FirstOrNotFoundAsync(
                existingPlan =>
                    existingPlan.Id == request.Id && existingPlan.ProjectId == request.ProjectId,
                cancellationToken
            );

            plan.Delete(timeProvider.GetStoredUtcNow());

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
