using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;

namespace TestCraft.Application.Common.Extensions;

public static class NotFoundExtensions
{
    public static async Task<T> FirstOrNotFoundAsync<T>(
        this IQueryable<T?> source,
        CancellationToken cancellationToken
    )
        where T : class =>
        await source.FirstOrDefaultAsync(cancellationToken) ?? throw new NotFoundException();

    public static async Task<T> FirstOrNotFoundAsync<T>(
        this IQueryable<T> source,
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken
    )
        where T : class =>
        await source.FirstOrDefaultAsync(predicate, cancellationToken)
        ?? throw new NotFoundException();

    public static async Task EnsureExistsAsync<T>(
        this IQueryable<T> source,
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken
    )
    {
        if (!await source.AnyAsync(predicate, cancellationToken))
        {
            throw new NotFoundException();
        }
    }
}
