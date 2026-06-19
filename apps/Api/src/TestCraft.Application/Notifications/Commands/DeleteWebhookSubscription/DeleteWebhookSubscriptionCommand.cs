using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications.Commands.DeleteWebhookSubscription;

public record DeleteWebhookSubscriptionCommand : IRequest, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class DeleteWebhookSubscriptionCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteWebhookSubscriptionCommand>
{
    public async Task Handle(
        DeleteWebhookSubscriptionCommand request,
        CancellationToken cancellationToken
    )
    {
        var subscription =
            await context.WebhookSubscriptions.FirstOrDefaultAsync(
                w => w.Id == request.Id && w.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        context.WebhookSubscriptions.Remove(subscription);
        await context.SaveChangesAsync(cancellationToken);
    }
}
