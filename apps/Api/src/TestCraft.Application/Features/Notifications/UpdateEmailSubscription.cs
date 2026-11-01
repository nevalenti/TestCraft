using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Notifications;

public static class UpdateEmailSubscription
{
    /// <summary>Updates an email subscription's address, events, and active state.</summary>
    public sealed record Command : IRequest<EmailSubscriptionResponse>, IProjectScopedRequest
    {
        /// <summary>The project the subscription belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The subscription to update.</summary>
        [JsonIgnore]
        public EmailSubscriptionId Id { get; init; }

        /// <summary>The email address to notify.</summary>
        public required string Email { get; init; }

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
            RuleFor(command => command.Email).NotEmpty().EmailAddress().MaximumLength(254);
            RuleFor(command => command.Events).NotEmpty();
            RuleForEach(command => command.Events).IsInEnum();
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
                    emailSubscription =>
                        emailSubscription.Id == request.Id
                        && emailSubscription.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            VersionCheck.Ensure(subscription, request.ExpectedVersion);
            subscription.Update(
                request.Email,
                NotificationEvents.Serialize(request.Events),
                request.IsActive
            );

            await context.SaveChangesAsync(cancellationToken);

            return EmailSubscriptionResponse.FromEntity(subscription);
        }
    }
}
