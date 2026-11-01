using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Pagination;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestCases;

/// <summary>Filters and ordering shared by the suite and project test case lists.</summary>
public abstract record TestCaseListQuery : SearchPageQuery
{
    public enum SortField
    {
        Name,
        Priority,
        CreatedAt,
    }

    /// <summary>Only test cases that carry this label.</summary>
    public LabelId? LabelId { get; init; }

    public SortField SortBy { get; init; } = SortField.CreatedAt;

    public SortDirection SortDir { get; init; } = SortDirection.Asc;

    private static readonly Expression<Func<TestCase, int>> PriorityRank = BuildPriorityRank();

    public Task<Paginated<TestCaseResponse>> ToPageAsync(
        IQueryable<TestCase> cases,
        CancellationToken cancellationToken
    )
    {
        cases = cases.WhereContainsIgnoringCase(testCase => testCase.Name, Search);

        if (LabelId is { } labelId)
        {
            cases = cases.Where(testCase =>
                testCase.TestCaseLabels.Any(link => link.LabelId == labelId)
            );
        }

        var sorted = SortBy switch
        {
            SortField.Name => cases.SortedBy(
                testCase => testCase.Name,
                SortDir,
                testCase => testCase.Id
            ),
            SortField.Priority => cases.SortedBy(PriorityRank, SortDir, testCase => testCase.Id),
            _ => cases.SortedBy(testCase => testCase.CreatedAt, SortDir, testCase => testCase.Id),
        };

        return sorted
            .Select(TestCaseResponse.Projection)
            .ToPaginatedAsync(ToPagination(), cancellationToken);
    }

    private static Expression<Func<TestCase, int>> BuildPriorityRank()
    {
        var testCase = Expression.Parameter(typeof(TestCase), "testCase");
        var priority = Expression.Property(testCase, nameof(TestCase.Priority));
        Expression rank = Expression.Constant(0);
        foreach (var value in Enum.GetValues<TestCasePriority>().Reverse())
        {
            rank = Expression.Condition(
                Expression.Equal(priority, Expression.Constant(value)),
                Expression.Constant((int)value),
                rank
            );
        }

        return Expression.Lambda<Func<TestCase, int>>(rank, testCase);
    }
}
