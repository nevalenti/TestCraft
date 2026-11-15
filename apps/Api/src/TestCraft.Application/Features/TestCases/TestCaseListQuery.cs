using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Pagination;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestCases;

public abstract record TestCaseListQuery : SearchPageQuery
{
    public enum SortField
    {
        Name,
        Priority,
        CreatedAt,
        Position,
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
            SortField.Position => ByPosition(cases),
            _ => cases.SortedBy(testCase => testCase.CreatedAt, SortDir, testCase => testCase.Id),
        };

        return sorted
            .Select(TestCaseResponse.Projection)
            .ToPaginatedAsync(ToPagination(), cancellationToken);
    }

    /// <summary>Top-level cases first, then each section's cases; positions only order cases within one section.</summary>
    private IOrderedQueryable<TestCase> ByPosition(IQueryable<TestCase> cases)
    {
        var bySection = cases
            .OrderBy(testCase => testCase.SectionId != null)
            .ThenBy(testCase => testCase.Section!.Position)
            .ThenBy(testCase => testCase.SectionId);

        return SortDir == SortDirection.Desc
            ? bySection
                .ThenByDescending(testCase => testCase.Position)
                .ThenByDescending(testCase => testCase.Id)
            : bySection.ThenBy(testCase => testCase.Position).ThenBy(testCase => testCase.Id);
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
