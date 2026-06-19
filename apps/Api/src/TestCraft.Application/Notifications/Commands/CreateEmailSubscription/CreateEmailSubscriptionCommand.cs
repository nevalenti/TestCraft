using System.Text.Json;
using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Notifications.Commands.CreateEmailSubscription;

public record CreateEmailSubscriptionCommand
    : IRequest<EmailSubscriptionResponse>,
        IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required string Email { get; init; }
    public required IReadOnlyList<string> Events { get; init; }
}

public class CreateEmailSubscriptionCommandValidator
    : AbstractValidator<CreateEmailSubscriptionCommand>
{
    public CreateEmailSubscriptionCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.Events).NotEmpty();
    }
}

public class CreateEmailSubscriptionCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateEmailSubscriptionCommand, EmailSubscriptionResponse>
{
    public async Task<EmailSubscriptionResponse> Handle(
        CreateEmailSubscriptionCommand request,
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
