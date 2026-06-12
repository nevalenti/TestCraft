namespace TestCraft.Application.Common.Pagination;

public record PaginationParams
{
    public const int DefaultPage = 1;
    public const int DefaultPageSize = 50;
    public const int MaxPageSize = 500;

    public int Page { get; init; } = DefaultPage;
    public int PageSize { get; init; } = DefaultPageSize;

    public int Skip => (Page - 1) * PageSize;
    public int Take => PageSize;

    public static PaginationParams Create(int? page, int? pageSize) =>
        new()
        {
            Page = page is > 0 ? page.Value : DefaultPage,
            PageSize = pageSize is > 0 and <= MaxPageSize ? pageSize.Value : DefaultPageSize,
        };
}
