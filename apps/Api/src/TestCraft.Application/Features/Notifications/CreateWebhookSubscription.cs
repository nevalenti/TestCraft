using System.Text.Json;
using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Notifications;

/// <summary>A webhook subscription that posts to a URL when project events occur.</summary>
public record WebhookSubscriptionResponse
{
    /// <summary>The subscription's identifier.</summary>
    public required WebhookSubscriptionId Id { get; init; }

    /// <summary>The project the subscription belongs to.</summary>
    public required ProjectId ProjectId { get; init; }

    /// <summary>The URL event payloads are posted to.</summary>
    public required string Url { get; init; }

    /// <summary>Whether the subscription is currently active.</summary>
    public required bool IsActive { get; init; }

    /// <summary>The event types the subscription notifies on.</summary>
    public required IReadOnlyList<string> Events { get; init; }

    /// <summary>When the subscription was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}

public static class CreateWebhookSubscription
{
    /// <summary>Subscribes a webhook URL to project event notifications.</summary>
    public sealed record Command : IRequest<WebhookSubscriptionResponse>, IProjectScopedRequest
    {
        /// <summary>The project to subscribe to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The URL to POST event payloads to.</summary>
        public required string Url { get; init; }

        /// <summary>An optional shared secret used to sign the webhook payload.</summary>
        public string? Secret { get; init; }

        /// <summary>The event types to notify on.</summary>
        public required IReadOnlyList<string> Events { get; init; }
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
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, WebhookSubscriptionResponse>
    {
        public async Task<WebhookSubscriptionResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var subscription = new WebhookSubscription
            {
                Id = WebhookSubscriptionId.New(),
                ProjectId = request.ProjectId,
                Url = request.Url,
                Secret = request.Secret,
                Events = JsonSerializer.Serialize(request.Events),
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            context.WebhookSubscriptions.Add(subscription);
            await context.SaveChangesAsync(cancellationToken);

            return new WebhookSubscriptionResponse
            {
                Id = subscription.Id,
                ProjectId = subscription.ProjectId,
                Url = subscription.Url,
                IsActive = subscription.IsActive,
                Events = request.Events,
                CreatedAt = subscription.CreatedAt,
            };
        }
    }
}
