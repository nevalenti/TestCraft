using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications.Queries.GetWebhookSubscriptions;

public record GetWebhookSubscriptionsQuery
    : IRequest<IReadOnlyList<WebhookSubscriptionResponse>>,
        IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
}

public class GetWebhookSubscriptionsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetWebhookSubscriptionsQuery, IReadOnlyList<WebhookSubscriptionResponse>>
{
    public async Task<IReadOnlyList<WebhookSubscriptionResponse>> Handle(
        GetWebhookSubscriptionsQuery request,
        CancellationToken cancellationToken
    )
    {
        var rows = await context
            .WebhookSubscriptions.Where(w => w.ProjectId == request.ProjectId)
            .ToListAsync(cancellationToken);

        return rows.Select(w => new WebhookSubscriptionResponse(
                w.Id,
                w.ProjectId,
                w.Url,
                w.IsActive,
                JsonSerializer.Deserialize<List<string>>(w.Events) ?? [],
                w.CreatedAt
            ))
            .ToList();
    }
}
