using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;

namespace TestCraft.Application.Common.Extensions;

public static class LikePattern
{
    public const string EscapeCharacter = "\\";

    public static string ContainsLiteral(string value) =>
        $"%{value.Replace("\\", "\\\\", StringComparison.Ordinal).Replace("%", "\\%", StringComparison.Ordinal).Replace("_", "\\_", StringComparison.Ordinal)}%";

    public static IQueryable<T> WhereContainsIgnoringCase<T>(
        this IQueryable<T> query,
        Expression<Func<T, string>> property,
        string? search
    )
    {
        if (string.IsNullOrWhiteSpace(search))
        {
            return query;
        }

        var pattern = ContainsLiteral(search.ToLowerInvariant());
#pragma warning disable CA1304, CA1311 // Translated to SQL lower(), not run in .NET.
        Expression<Func<string, bool>> matches = value =>
            EF.Functions.Like(value.ToLower(), pattern, EscapeCharacter);
#pragma warning restore CA1304, CA1311
        var body = ReplacingExpressionVisitor.Replace(
            matches.Parameters[0],
            property.Body,
            matches.Body
        );

        return query.Where(Expression.Lambda<Func<T, bool>>(body, property.Parameters));
    }
}
