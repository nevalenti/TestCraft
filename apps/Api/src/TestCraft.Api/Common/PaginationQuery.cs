using TestCraft.Domain.Pagination;

namespace TestCraft.Api.Common;

public record PaginationQuery
{
    public int? Page { get; init; }

    public int? PageSize { get; init; }

    public PaginationParams ToPaginationParams() =>
        new()
        {
            Page = Page is > 0 ? Page.Value : PaginationParams.DefaultPage,
            PageSize = PageSize is > 0 and <= PaginationParams.MaxPageSize
                ? PageSize.Value
                : PaginationParams.DefaultPageSize,
        };
}
