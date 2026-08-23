using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestPlans;

public static class RemoveCaseFromPlan
{
    /// <summary>Removes a test case from a plan.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The plan to remove the test case from.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public TestPlanId TestPlanId { get; init; }

        /// <summary>The test case to remove.</summary>
        public required TestCaseId TestCaseId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var entry = await context.TestPlanCases.FirstOrDefaultAsync(
                tpc =>
                    tpc.TestPlanId == request.TestPlanId
                    && tpc.TestCaseId == request.TestCaseId
                    && tpc.TestPlan!.ProjectId == request.ProjectId,
                cancellationToken
            );

            if (entry is null)
            {
                return;
            }

            context.TestPlanCases.Remove(entry);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
