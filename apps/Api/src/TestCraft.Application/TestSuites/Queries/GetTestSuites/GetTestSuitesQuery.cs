using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Pagination;

namespace TestCraft.Application.TestSuites.Queries.GetTestSuites;

public record GetTestSuitesQuery : IRequest<Paginated<TestSuiteResponse>>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public string? Search { get; init; }
    public required PaginationParams Pagination { get; init; }
}

public class GetTestSuitesQueryHandler(IApplicationDbContext context)
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

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(s => s.CreatedAt)
            .Skip(request.Pagination.Skip)
            .Take(request.Pagination.Take)
            .Select(TestSuiteResponse.Projection)
            .ToListAsync(cancellationToken);

        return new Paginated<TestSuiteResponse>
        {
            Items = items,
            Total = total,
            Page = request.Pagination.Page,
            PageSize = request.Pagination.PageSize,
        };
    }
}
