using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Labels;

public static class GetLabels
{
    /// <summary>Lists the labels defined in a project.</summary>
    public sealed record Query : IRequest<IReadOnlyList<LabelResponse>>, IProjectScopedRequest
    {
        /// <summary>The project to list labels for.</summary>
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
                .Labels.Where(label => label.ProjectId == request.ProjectId)
                .OrderBy(label => label.Name)
                .Select(label => new LabelResponse
                {
                    Id = label.Id,
                    Name = label.Name,
                    Color = label.Color,
                    ProjectId = label.ProjectId,
                })
                .ToListAsync(cancellationToken);
        }
    }
}
