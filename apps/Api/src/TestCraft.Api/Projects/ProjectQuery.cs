using TestCraft.Api.Common;

namespace TestCraft.Api.Projects;

public record ProjectQuery : PaginationQuery
{
    public string? Search { get; init; }
}
