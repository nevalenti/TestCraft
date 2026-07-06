using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans;

public static class DeleteTestPlan
{
    /// <summary>Soft-deletes a test plan.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The plan to delete.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var plan =
                await context.TestPlans.FirstOrDefaultAsync(
                    p => p.Id == request.Id && p.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            plan.IsDeleted = true;
            plan.DeletedAt = DateTimeOffset.UtcNow;

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
