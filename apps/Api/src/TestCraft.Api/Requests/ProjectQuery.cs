using TestCraft.Api.Common;

namespace TestCraft.Api.Requests;

public record ProjectQuery : PaginationQuery
{
    public string? Search { get; init; }
}
