using Microsoft.EntityFrameworkCore;

namespace TestCraft.Application.Common.Pagination;

public static class QueryablePaging
{
    public static async Task<Paginated<T>> ToPaginatedAsync<T>(
        this IQueryable<T> query,
        PaginationParams pagination,
        CancellationToken cancellationToken
    )
    {
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip(pagination.Skip)
            .Take(pagination.Take)
            .ToListAsync(cancellationToken);

        return new Paginated<T>
        {
            Items = items,
            Total = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize,
        };
    }
}
