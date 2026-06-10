using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Pagination;

namespace TestCraft.Application.TestRuns.Queries.GetTestRuns;

public record GetTestRunsQuery
    : IRequest<Paginated<TestRunResponse>>,
        IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public string? Search { get; init; }
    public required PaginationParams Pagination { get; init; }
}

public class GetTestRunsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTestRunsQuery, Paginated<TestRunResponse>>
{
    public async Task<Paginated<TestRunResponse>> Handle(
        GetTestRunsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = context.TestRuns.Where(r =>
            r.ProjectId == request.ProjectId
        );

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(r =>
                EF.Functions.ILike(r.Name, $"%{request.Search}%")
            );
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(request.Pagination.Skip)
            .Take(request.Pagination.Take)
            .Select(TestRunResponse.Projection)
            .ToListAsync(cancellationToken);

        return new Paginated<TestRunResponse>
        {
            Items = items,
            Total = total,
            Page = request.Pagination.Page,
            PageSize = request.Pagination.PageSize,
        };
    }
}
