using TestCraft.Api.Common;

namespace TestCraft.Api.TestSuites;

public record TestSuiteQuery : PaginationQuery
{
    public string? Search { get; init; }
}
