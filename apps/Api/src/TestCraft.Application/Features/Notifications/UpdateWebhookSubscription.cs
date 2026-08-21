using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Notifications;

public static class UpdateWebhookSubscription
{
    /// <summary>Updates a webhook subscription's URL, secret, events, and active state.</summary>
    public sealed record Command : IRequest<WebhookSubscriptionResponse>, IProjectScopedRequest
    {
        /// <summary>The project the subscription belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The subscription to update.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public WebhookSubscriptionId Id { get; init; }

        /// <summary>The URL to POST event payloads to.</summary>
        public required string Url { get; init; }

        /// <summary>An optional shared secret used to sign the webhook payload.</summary>
        public string? Secret { get; init; }

        /// <summary>The event types to notify on.</summary>
        public required IReadOnlyList<string> Events { get; init; }

        /// <summary>Whether the subscription is active.</summary>
        public required bool IsActive { get; init; }
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
            var subscription =
                await context.WebhookSubscriptions.FirstOrDefaultAsync(
                    webhookSubscription =>
                        webhookSubscription.Id == request.Id
                        && webhookSubscription.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            subscription.Url = request.Url;
            subscription.Secret = request.Secret;
            subscription.Events = JsonSerializer.Serialize(request.Events);
            subscription.IsActive = request.IsActive;

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
