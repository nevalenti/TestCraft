using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCases.Queries.GetTestCasesByProject;

public record GetTestCasesByProjectQuery
    : IRequest<Paginated<TestCaseResponse>>,
        IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public string? Search { get; init; }
    public int? Page { get; init; }
    public int? PageSize { get; init; }
}

public class GetTestCasesByProjectQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetTestCasesByProjectQuery, Paginated<TestCaseResponse>>
{
    public async Task<Paginated<TestCaseResponse>> Handle(
        GetTestCasesByProjectQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = context.TestCases.Where(c => c.Suite!.ProjectId == request.ProjectId);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(c => EF.Functions.ILike(c.Name, $"%{request.Search}%"));
        }

        var pagination = PaginationParams.Create(request.Page, request.PageSize);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(c => c.CreatedAt)
            .Skip(pagination.Skip)
            .Take(pagination.Take)
            .ProjectTo<TestCaseResponse>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return new Paginated<TestCaseResponse>
        {
            Items = items,
            Total = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize,
        };
    }
}
