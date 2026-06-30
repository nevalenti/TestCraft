using System.Text.Json;
using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Notifications;

public record EmailSubscriptionResponse(
    Guid Id,
    Guid ProjectId,
    string Email,
    bool IsActive,
    IReadOnlyList<string> Events,
    DateTimeOffset CreatedAt
);

public static class CreateEmailSubscription
{
    public sealed record Command : IRequest<EmailSubscriptionResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required string Email { get; init; }
        public required IReadOnlyList<string> Events { get; init; }
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
            var subscription = new EmailSubscription
            {
                ProjectId = request.ProjectId,
                Email = request.Email,
                Events = JsonSerializer.Serialize(request.Events),
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            context.EmailSubscriptions.Add(subscription);
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
