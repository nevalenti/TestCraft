using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans.Commands.DeleteTestPlan;

public record DeleteTestPlanCommand : IRequest, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class DeleteTestPlanCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteTestPlanCommand>
{
    public async Task Handle(DeleteTestPlanCommand request, CancellationToken cancellationToken)
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
