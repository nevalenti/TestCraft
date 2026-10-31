namespace TestCraft.Application.Common.Pagination;

public abstract record PageQuery
{
    public const int MaxPage = 10_000;
    public const int MaxOffset = 100_000;

    public int Page { get; init; } = PaginationParams.DefaultPage;

    public int PageSize { get; init; } = PaginationParams.DefaultPageSize;

    public PaginationParams ToPagination() => new() { Page = Page, PageSize = PageSize };
}

public abstract record SearchPageQuery : PageQuery
{
    public const int MaxSearchLength = 200;

    public string? Search { get; init; }
}
