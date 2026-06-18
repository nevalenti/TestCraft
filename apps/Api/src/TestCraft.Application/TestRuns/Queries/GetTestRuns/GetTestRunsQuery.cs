using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestRuns.Queries.GetTestRuns;

public record GetTestRunsQuery : IRequest<Paginated<TestRunResponse>>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public string? Search { get; init; }
    public int? Page { get; init; }
    public int? PageSize { get; init; }
}

public class GetTestRunsQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetTestRunsQuery, Paginated<TestRunResponse>>
{
    public async Task<Paginated<TestRunResponse>> Handle(
        GetTestRunsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = context.TestRuns.Where(r => r.ProjectId == request.ProjectId);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(r => EF.Functions.ILike(r.Name, $"%{request.Search}%"));
        }

        var pagination = PaginationParams.Create(request.Page, request.PageSize);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(pagination.Skip)
            .Take(pagination.Take)
            .ProjectTo<TestRunResponse>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return new Paginated<TestRunResponse>
        {
            Items = items,
            Total = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize,
        };
    }
}
