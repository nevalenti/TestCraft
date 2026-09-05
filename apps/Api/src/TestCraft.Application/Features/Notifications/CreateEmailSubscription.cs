using System.Text.Json;

using FluentValidation;

using MediatR;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Notifications;

/// <summary>An email subscription that notifies an address when project events occur.</summary>
public record EmailSubscriptionResponse
{
    /// <summary>The subscription's identifier.</summary>
    public required EmailSubscriptionId Id { get; init; }

    /// <summary>The project the subscription belongs to.</summary>
    public required ProjectId ProjectId { get; init; }

    /// <summary>The email address being notified.</summary>
    public required string Email { get; init; }

    /// <summary>Whether the subscription is currently active.</summary>
    public required bool IsActive { get; init; }

    /// <summary>The event types the subscription notifies on.</summary>
    public required IReadOnlyList<string> Events { get; init; }

    /// <summary>When the subscription was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}

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
        public required IReadOnlyList<string> Events { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Email).NotEmpty().EmailAddress().MaximumLength(254);
            RuleFor(command => command.Events).NotEmpty();
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
            var subscription = new EmailSubscription
            {
                Id = EmailSubscriptionId.New(),
                ProjectId = request.ProjectId,
                Email = request.Email,
                Events = JsonSerializer.Serialize(request.Events),
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            context.EmailSubscriptions.Add(subscription);

            await context.SaveChangesAsync(cancellationToken);

            return new EmailSubscriptionResponse
            {
                Id = subscription.Id,
                ProjectId = subscription.ProjectId,
                Email = subscription.Email,
                IsActive = subscription.IsActive,
                Events = request.Events,
                CreatedAt = subscription.CreatedAt,
            };
        }
    }
}
