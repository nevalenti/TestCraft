using TestCraft.Api.Common;

namespace TestCraft.Api.TestCases;

public record TestCaseQuery : PaginationQuery
{
    public string? Search { get; init; }
}
