using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Notifications;

public static class CreateWebhookSubscription
{
    /// <summary>Subscribes a webhook URL to project event notifications.</summary>
    public sealed record Command : IRequest<WebhookSubscriptionResponse>, IProjectScopedRequest
    {
        /// <summary>The project to subscribe to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The URL to POST event payloads to.</summary>
        public required string Url { get; init; }

        /// <summary>An optional shared secret used to sign the webhook payload.</summary>
        public string? Secret { get; init; }

        /// <summary>The event types to notify on.</summary>
        public required IReadOnlyList<NotificationEvent> Events { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Url)
                .NotEmpty()
                .MaximumLength(2000)
                .Must(WebhookUrlGuard.IsAllowed)
                .WithMessage(
                    "Must be a public http(s) URL; loopback, private, and link-local "
                        + "addresses are not allowed"
                );
            RuleFor(command => command.Secret).MaximumLength(200);
            RuleFor(command => command.Events).NotEmpty();
            RuleForEach(command => command.Events).IsInEnum();
        }
    }

    public sealed class Handler(IApplicationDbContext context, TimeProvider timeProvider)
        : IRequestHandler<Command, WebhookSubscriptionResponse>
    {
        public async Task<WebhookSubscriptionResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var subscription = WebhookSubscription.Create(
                request.ProjectId,
                request.Url,
                request.Secret,
                NotificationEvents.Serialize(request.Events),
                timeProvider.GetStoredUtcNow()
            );

            context.WebhookSubscriptions.Add(subscription);

            await context.SaveChangesAsync(cancellationToken);

            return WebhookSubscriptionResponse.FromEntity(subscription);
        }
    }
}
