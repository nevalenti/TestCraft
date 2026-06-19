using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCases.Queries.GetTestCases;

public record GetTestCasesQuery : IRequest<Paginated<TestCaseResponse>>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public Guid SuiteId { get; init; }
    public string? Search { get; init; }
    public Guid? LabelId { get; init; }
    public int? Page { get; init; }
    public int? PageSize { get; init; }
}

public class GetTestCasesQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetTestCasesQuery, Paginated<TestCaseResponse>>
{
    public async Task<Paginated<TestCaseResponse>> Handle(
        GetTestCasesQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = context.TestCases.Where(c => c.SuiteId == request.SuiteId);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(c => EF.Functions.ILike(c.Name, $"%{request.Search}%"));
        }

        if (request.LabelId.HasValue)
        {
            query = query.Where(c =>
                c.TestCaseLabels.Any(tcl => tcl.LabelId == request.LabelId.Value)
            );
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
