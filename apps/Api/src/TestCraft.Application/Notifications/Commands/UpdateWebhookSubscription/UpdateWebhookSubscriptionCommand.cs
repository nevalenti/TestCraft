using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications.Commands.UpdateWebhookSubscription;

public record UpdateWebhookSubscriptionCommand
    : IRequest<WebhookSubscriptionResponse>,
        IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
    public required string Url { get; init; }
    public string? Secret { get; init; }
    public required IReadOnlyList<string> Events { get; init; }
    public required bool IsActive { get; init; }
}

public class UpdateWebhookSubscriptionCommandValidator
    : AbstractValidator<UpdateWebhookSubscriptionCommand>
{
    public UpdateWebhookSubscriptionCommandValidator()
    {
        RuleFor(x => x.Url)
            .NotEmpty()
            .MaximumLength(2000)
            .Must(BeValidUri)
            .WithMessage("Must be a valid URL");
        RuleFor(x => x.Secret).MaximumLength(200);
        RuleFor(x => x.Events).NotEmpty();
    }

    private static bool BeValidUri(string url) => Uri.TryCreate(url, UriKind.Absolute, out _);
}

public class UpdateWebhookSubscriptionCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateWebhookSubscriptionCommand, WebhookSubscriptionResponse>
{
    public async Task<WebhookSubscriptionResponse> Handle(
        UpdateWebhookSubscriptionCommand request,
        CancellationToken cancellationToken
    )
    {
        var subscription =
            await context.WebhookSubscriptions.FirstOrDefaultAsync(
                w => w.Id == request.Id && w.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        subscription.Url = request.Url;
        subscription.Secret = request.Secret;
        subscription.Events = JsonSerializer.Serialize(request.Events);
        subscription.IsActive = request.IsActive;

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
