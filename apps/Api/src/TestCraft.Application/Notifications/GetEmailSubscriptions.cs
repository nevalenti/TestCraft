using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications;

public static class GetEmailSubscriptions
{
    /// <summary>Lists the email subscriptions on a project.</summary>
    public sealed record Query
        : IRequest<IReadOnlyList<EmailSubscriptionResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list subscriptions for.</summary>
        public required Guid ProjectId { get; init; }
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
                .Where(e => e.ProjectId == request.ProjectId)
                .ToListAsync(cancellationToken);

            return rows.Select(e => new EmailSubscriptionResponse
                {
                    Id = e.Id,
                    ProjectId = e.ProjectId,
                    Email = e.Email,
                    IsActive = e.IsActive,
                    Events = JsonSerializer.Deserialize<List<string>>(e.Events) ?? [],
                    CreatedAt = e.CreatedAt,
                })
                .ToList();
        }
    }
}
