using System.Text.Json;
using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Notifications;

public record WebhookSubscriptionResponse(
    Guid Id,
    Guid ProjectId,
    string Url,
    bool IsActive,
    IReadOnlyList<string> Events,
    DateTimeOffset CreatedAt
);

public static class CreateWebhookSubscription
{
    public sealed record Command : IRequest<WebhookSubscriptionResponse>, IProjectScopedRequest
    {
        public required Guid ProjectId { get; init; }
        public required string Url { get; init; }
        public string? Secret { get; init; }
        public required IReadOnlyList<string> Events { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Url)
                .NotEmpty()
                .MaximumLength(2000)
                .Must(BeValidUri)
                .WithMessage("Must be a valid URL");
            RuleFor(x => x.Secret).MaximumLength(200);
            RuleFor(x => x.Events).NotEmpty();
        }

        private static bool BeValidUri(string url) =>
            Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
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
                ProjectId = request.ProjectId,
                Url = request.Url,
                Secret = request.Secret,
                Events = JsonSerializer.Serialize(request.Events),
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            context.WebhookSubscriptions.Add(subscription);
            await context.SaveChangesAsync(cancellationToken);

            return new WebhookSubscriptionResponse(
                subscription.Id,
                subscription.ProjectId,
                subscription.Url,
                subscription.IsActive,
                request.Events,
                subscription.CreatedAt
            );
        }
    }
}
