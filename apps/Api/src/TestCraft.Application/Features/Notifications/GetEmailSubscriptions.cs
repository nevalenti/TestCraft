using System.Text.Json;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Notifications;

public static class GetEmailSubscriptions
{
    /// <summary>Lists the email subscriptions on a project.</summary>
    public sealed record Query
        : IRequest<IReadOnlyList<EmailSubscriptionResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list subscriptions for.</summary>
        public required ProjectId ProjectId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<EmailSubscriptionResponse>>
    {
        public async Task<IReadOnlyList<EmailSubscriptionResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var rows = await context
                .EmailSubscriptions.AsNoTracking()
                .Where(subscription => subscription.ProjectId == request.ProjectId)
                .ToListAsync(cancellationToken);

            return rows.Select(subscription => new EmailSubscriptionResponse
                {
                    Id = subscription.Id,
                    ProjectId = subscription.ProjectId,
                    Email = subscription.Email,
                    IsActive = subscription.IsActive,
                    Events = JsonSerializer.Deserialize<List<string>>(subscription.Events) ?? [],
                    CreatedAt = subscription.CreatedAt,
                })
                .ToList();
        }
    }
}
