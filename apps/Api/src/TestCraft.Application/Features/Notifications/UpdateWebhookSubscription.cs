using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Notifications;

public static class UpdateWebhookSubscription
{
    /// <summary>Updates a webhook subscription's URL, secret, events, and active state.</summary>
    public sealed record Command : IRequest<WebhookSubscriptionResponse>, IProjectScopedRequest
    {
        /// <summary>The project the subscription belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The subscription to update.</summary>
        [JsonIgnore]
        public WebhookSubscriptionId Id { get; init; }

        /// <summary>The URL to POST event payloads to.</summary>
        public required string Url { get; init; }

        /// <summary>
        /// The shared secret that signs payloads. Leave it out to keep the current one; send
        /// null to remove it.
        /// </summary>
        public string? Secret
        {
            get;
            init
            {
                field = value;
                IsSecretProvided = true;
            }
        }

        [JsonIgnore]
        public bool IsSecretProvided { get; private init; }

        /// <summary>The event types to notify on.</summary>
        public required IReadOnlyList<NotificationEvent> Events { get; init; }

        /// <summary>Whether the subscription is active.</summary>
        public required bool IsActive { get; init; }

        [JsonIgnore]
        public int? ExpectedVersion { get; init; }
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

            VersionCheck.Ensure(subscription, request.ExpectedVersion);
            subscription.Update(
                request.Url,
                request.IsSecretProvided ? request.Secret : subscription.Secret,
                NotificationEvents.Serialize(request.Events),
                request.IsActive
            );

            await context.SaveChangesAsync(cancellationToken);

            return WebhookSubscriptionResponse.FromEntity(subscription);
        }
    }
}
