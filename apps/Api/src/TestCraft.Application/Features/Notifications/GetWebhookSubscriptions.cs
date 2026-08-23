using System.Text.Json;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Notifications;

public static class GetWebhookSubscriptions
{
    /// <summary>Lists the webhook subscriptions on a project.</summary>
    public sealed record Query
        : IRequest<IReadOnlyList<WebhookSubscriptionResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list subscriptions for.</summary>
        public required ProjectId ProjectId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<WebhookSubscriptionResponse>>
    {
        public async Task<IReadOnlyList<WebhookSubscriptionResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var rows = await context
                .WebhookSubscriptions.AsNoTracking()
                .Where(subscription => subscription.ProjectId == request.ProjectId)
                .ToListAsync(cancellationToken);

            return rows.Select(subscription => new WebhookSubscriptionResponse
                {
                    Id = subscription.Id,
                    ProjectId = subscription.ProjectId,
                    Url = subscription.Url,
                    IsActive = subscription.IsActive,
                    Events = JsonSerializer.Deserialize<List<string>>(subscription.Events) ?? [],
                    CreatedAt = subscription.CreatedAt,
                })
                .ToList();
        }
    }
}
