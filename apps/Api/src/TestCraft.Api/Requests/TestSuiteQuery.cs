using TestCraft.Api.Common;

namespace TestCraft.Api.Requests;

public record TestSuiteQuery : PaginationQuery
{
    public string? Search { get; init; }
}
