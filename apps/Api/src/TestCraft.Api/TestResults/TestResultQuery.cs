using TestCraft.Api.Common;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.TestResults;

public record TestResultQuery : PaginationQuery
{
    public TestResultStatus? Status { get; init; }

    public string? Search { get; init; }
}
