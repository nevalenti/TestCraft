using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Notifications;

public static class GetEmailSubscriptions
{
    public sealed record Query
        : IRequest<IReadOnlyList<EmailSubscriptionResponse>>,
            IProjectScopedRequest
    {
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
}
