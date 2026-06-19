using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications.Queries.GetEmailSubscriptions;

public record GetEmailSubscriptionsQuery
    : IRequest<IReadOnlyList<EmailSubscriptionResponse>>,
        IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
}

public class GetEmailSubscriptionsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetEmailSubscriptionsQuery, IReadOnlyList<EmailSubscriptionResponse>>
{
    public async Task<IReadOnlyList<EmailSubscriptionResponse>> Handle(
        GetEmailSubscriptionsQuery request,
        CancellationToken cancellationToken
    )
    {
        var rows = await context
            .EmailSubscriptions.Where(e => e.ProjectId == request.ProjectId)
            .ToListAsync(cancellationToken);

        return rows.Select(e => new EmailSubscriptionResponse(
                e.Id,
                e.ProjectId,
                e.Email,
                e.IsActive,
                JsonSerializer.Deserialize<List<string>>(e.Events) ?? [],
                e.CreatedAt
            ))
            .ToList();
    }
}
