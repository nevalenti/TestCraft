using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Notifications;

public static class DeleteEmailSubscription
{
    /// <summary>Deletes an email subscription.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the subscription belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The subscription to delete.</summary>
        public required EmailSubscriptionId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var subscription =
                await context.EmailSubscriptions.FirstOrDefaultAsync(
                    emailSubscription =>
                        emailSubscription.Id == request.Id
                        && emailSubscription.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            context.EmailSubscriptions.Remove(subscription);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
