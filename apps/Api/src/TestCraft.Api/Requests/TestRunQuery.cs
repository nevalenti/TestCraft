using TestCraft.Api.Common;

namespace TestCraft.Api.Requests;

public record TestRunQuery : PaginationQuery
{
    public string? Search { get; init; }
}
