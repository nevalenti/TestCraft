using System.Linq.Expressions;

namespace TestCraft.Application.Common.Pagination;

public static class QueryableSorting
{
    public static IOrderedQueryable<T> SortedBy<T, TKey, TTiebreaker>(
        this IQueryable<T> source,
        Expression<Func<T, TKey>> key,
        SortDirection direction,
        Expression<Func<T, TTiebreaker>> tiebreaker
    )
    {
        var descending = direction == SortDirection.Desc;

        IOrderedQueryable<T> ordered;
        if (default(TKey) is null)
        {
            var isNull = Expression.Lambda<Func<T, bool>>(
                Expression.Equal(key.Body, Expression.Constant(null, typeof(TKey))),
                key.Parameters
            );
            var nullsLast = source.OrderBy(isNull);
            ordered = descending ? nullsLast.ThenByDescending(key) : nullsLast.ThenBy(key);
        }
        else
        {
            ordered = descending ? source.OrderByDescending(key) : source.OrderBy(key);
        }

        return descending ? ordered.ThenByDescending(tiebreaker) : ordered.ThenBy(tiebreaker);
    }
}
