using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Labels.Queries.GetLabels;

public record GetLabelsQuery : IRequest<IReadOnlyList<LabelResponse>>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
}

public class GetLabelsQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetLabelsQuery, IReadOnlyList<LabelResponse>>
{
    public async Task<IReadOnlyList<LabelResponse>> Handle(
        GetLabelsQuery request,
        CancellationToken cancellationToken
    )
    {
        return await context
            .Labels.Where(l => l.ProjectId == request.ProjectId)
            .OrderBy(l => l.Name)
            .ProjectTo<LabelResponse>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
