using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Labels;

public static class GetLabels
{
    public sealed record Query : IRequest<IReadOnlyList<LabelResponse>>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<LabelResponse>>
    {
        public async Task<IReadOnlyList<LabelResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            return await context
                .Labels.Where(l => l.ProjectId == request.ProjectId)
                .OrderBy(l => l.Name)
                .Select(l => new LabelResponse
                {
                    Id = l.Id,
                    Name = l.Name,
                    Color = l.Color,
                    ProjectId = l.ProjectId,
                })
                .ToListAsync(cancellationToken);
        }
    }
}
