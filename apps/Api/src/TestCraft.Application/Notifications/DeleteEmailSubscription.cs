using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications;

public static class DeleteEmailSubscription
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
                await context.EmailSubscriptions.FirstOrDefaultAsync(
                    e => e.Id == request.Id && e.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            context.EmailSubscriptions.Remove(subscription);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
