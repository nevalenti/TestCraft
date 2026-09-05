using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Notifications;

public static class DeleteWebhookSubscription
{
    /// <summary>Deletes a webhook subscription.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the subscription belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The subscription to delete.</summary>
        public required WebhookSubscriptionId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var subscription =
                await context.WebhookSubscriptions.FirstOrDefaultAsync(
                    webhookSubscription =>
                        webhookSubscription.Id == request.Id
                        && webhookSubscription.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            context.WebhookSubscriptions.Remove(subscription);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
