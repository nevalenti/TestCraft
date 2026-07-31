using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Notifications;

public static class UpdateEmailSubscription
{
    /// <summary>Updates an email subscription's address, events, and active state.</summary>
    public sealed record Command : IRequest<EmailSubscriptionResponse>, IProjectScopedRequest
    {
        /// <summary>The project the subscription belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The subscription to update.</summary>
        public Guid Id { get; init; }

        /// <summary>The email address to notify.</summary>
        public required string Email { get; init; }

        /// <summary>The event types to notify on.</summary>
        public required IReadOnlyList<string> Events { get; init; }

        /// <summary>Whether the subscription is active.</summary>
        public required bool IsActive { get; init; }
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
            var subscription =
                await context.EmailSubscriptions.FirstOrDefaultAsync(
                    emailSubscription =>
                        emailSubscription.Id == request.Id
                        && emailSubscription.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            subscription.Email = request.Email;
            subscription.Events = JsonSerializer.Serialize(request.Events);
            subscription.IsActive = request.IsActive;

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
