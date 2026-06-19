using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications.Commands.DeleteEmailSubscription;

public record DeleteEmailSubscriptionCommand : IRequest, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class DeleteEmailSubscriptionCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteEmailSubscriptionCommand>
{
    public async Task Handle(
        DeleteEmailSubscriptionCommand request,
        CancellationToken cancellationToken
    )
    {
        var subscription =
            await context.EmailSubscriptions.FirstOrDefaultAsync(
                e => e.Id == request.Id && e.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        context.EmailSubscriptions.Remove(subscription);
        await context.SaveChangesAsync(cancellationToken);
    }
}
