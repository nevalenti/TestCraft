using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Notifications;

public static class CreateEmailSubscription
{
    /// <summary>Subscribes an email address to project event notifications.</summary>
    public sealed record Command : IRequest<EmailSubscriptionResponse>, IProjectScopedRequest
    {
        /// <summary>The project to subscribe to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The email address to notify.</summary>
        public required string Email { get; init; }

        /// <summary>The event types to notify on.</summary>
        public required IReadOnlyList<NotificationEvent> Events { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Email).NotEmpty().EmailAddress().MaximumLength(254);
            RuleFor(command => command.Events).NotEmpty();
            RuleForEach(command => command.Events).IsInEnum();
        }
    }

    public sealed class Handler(IApplicationDbContext context, TimeProvider timeProvider)
        : IRequestHandler<Command, EmailSubscriptionResponse>
    {
        public async Task<EmailSubscriptionResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var subscription = EmailSubscription.Create(
                request.ProjectId,
                request.Email,
                NotificationEvents.Serialize(request.Events),
                timeProvider.GetStoredUtcNow()
            );

            context.EmailSubscriptions.Add(subscription);

            await context.SaveChangesAsync(cancellationToken);

            return EmailSubscriptionResponse.FromEntity(subscription);
        }
    }
}
