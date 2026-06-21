using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications;

public static class DeleteWebhookSubscription
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        public required Guid ProjectId { get; init; }
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
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
}
