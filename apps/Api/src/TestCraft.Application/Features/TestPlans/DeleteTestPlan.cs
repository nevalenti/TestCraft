using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestPlans;

public static class DeleteTestPlan
{
    /// <summary>Soft-deletes a test plan.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The plan to delete.</summary>
        [JsonIgnore]
        public TestPlanId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var plan =
                await context.TestPlans.FirstOrDefaultAsync(
                    existingPlan =>
                        existingPlan.Id == request.Id
                        && existingPlan.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            plan.IsDeleted = true;
            plan.DeletedAt = DateTimeOffset.UtcNow;

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
