namespace TestCraft.Application.Common.Pagination;

/// <summary>A single page of a larger result set.</summary>
public record Paginated<T>
{
    /// <summary>The items on this page.</summary>
    public required IReadOnlyList<T> Items { get; init; }

    /// <summary>The total number of items across all pages.</summary>
    public required int Total { get; init; }

    /// <summary>The current page number.</summary>
    public required int Page { get; init; }

    /// <summary>The number of items per page.</summary>
    public required int PageSize { get; init; }
}
