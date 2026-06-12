using TestCraft.Api.Common;

namespace TestCraft.Api.Requests;

public record TestCaseQuery : PaginationQuery
{
    public string? Search { get; init; }
}
