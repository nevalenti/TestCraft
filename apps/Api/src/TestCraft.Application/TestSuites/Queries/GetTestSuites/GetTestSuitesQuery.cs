using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestSuites.Queries.GetTestSuites;

public record GetTestSuitesQuery : IRequest<Paginated<TestSuiteResponse>>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public string? Search { get; init; }
    public int? Page { get; init; }
    public int? PageSize { get; init; }
}

public class GetTestSuitesQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetTestSuitesQuery, Paginated<TestSuiteResponse>>
{
    public async Task<Paginated<TestSuiteResponse>> Handle(
        GetTestSuitesQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = context.TestSuites.Where(s => s.ProjectId == request.ProjectId);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(s => EF.Functions.ILike(s.Name, $"%{request.Search}%"));
        }

        var pagination = PaginationParams.Create(request.Page, request.PageSize);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(s => s.CreatedAt)
            .Skip(pagination.Skip)
            .Take(pagination.Take)
            .ProjectTo<TestSuiteResponse>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return new Paginated<TestSuiteResponse>
        {
            Items = items,
            Total = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize,
        };
    }
}
