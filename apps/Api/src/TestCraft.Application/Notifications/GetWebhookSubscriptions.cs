using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications;

public static class GetWebhookSubscriptions
{
    /// <summary>Lists the webhook subscriptions on a project.</summary>
    public sealed record Query
        : IRequest<IReadOnlyList<WebhookSubscriptionResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list subscriptions for.</summary>
        public required Guid ProjectId { get; init; }
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
                .WebhookSubscriptions.Where(w => w.ProjectId == request.ProjectId)
                .ToListAsync(cancellationToken);

            return rows.Select(w => new WebhookSubscriptionResponse
                {
                    Id = w.Id,
                    ProjectId = w.ProjectId,
                    Url = w.Url,
                    IsActive = w.IsActive,
                    Events = JsonSerializer.Deserialize<List<string>>(w.Events) ?? [],
                    CreatedAt = w.CreatedAt,
                })
                .ToList();
        }
    }
}
