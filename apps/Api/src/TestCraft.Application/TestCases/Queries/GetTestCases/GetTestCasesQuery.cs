using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Pagination;

namespace TestCraft.Application.TestCases.Queries.GetTestCases;

public record GetTestCasesQuery : IRequest<Paginated<TestCaseResponse>>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid SuiteId { get; init; }
    public string? Search { get; init; }
    public required PaginationParams Pagination { get; init; }
}

public class GetTestCasesQueryHandler(IApplicationDbContext context)
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

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(c => c.CreatedAt)
            .Skip(request.Pagination.Skip)
            .Take(request.Pagination.Take)
            .Select(TestCaseResponse.Projection)
            .ToListAsync(cancellationToken);

        return new Paginated<TestCaseResponse>
        {
            Items = items,
            Total = total,
            Page = request.Pagination.Page,
            PageSize = request.Pagination.PageSize,
        };
    }
}
