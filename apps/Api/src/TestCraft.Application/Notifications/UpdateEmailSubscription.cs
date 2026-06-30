using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications;

public static class UpdateEmailSubscription
{
    public sealed record Command : IRequest<EmailSubscriptionResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid Id { get; init; }
        public required string Email { get; init; }
        public required IReadOnlyList<string> Events { get; init; }
        public required bool IsActive { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
            RuleFor(x => x.Events).NotEmpty();
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, EmailSubscriptionResponse>
    {
        public async Task<EmailSubscriptionResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var subscription =
                await context.EmailSubscriptions.FirstOrDefaultAsync(
                    e => e.Id == request.Id && e.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            subscription.Email = request.Email;
            subscription.Events = JsonSerializer.Serialize(request.Events);
            subscription.IsActive = request.IsActive;

            await context.SaveChangesAsync(cancellationToken);

            return new EmailSubscriptionResponse(
                subscription.Id,
                subscription.ProjectId,
                subscription.Email,
                subscription.IsActive,
                request.Events,
                subscription.CreatedAt
            );
        }
    }
}
