using TestCraft.Api.Common;

namespace TestCraft.Api.TestRuns;

public record TestRunQuery : PaginationQuery
{
    public string? Search { get; init; }
}
