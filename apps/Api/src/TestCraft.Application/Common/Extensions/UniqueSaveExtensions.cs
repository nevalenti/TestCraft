using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Common.Extensions;

public static class UniqueSaveExtensions
{
    public static async Task SaveOrConflictAsync(
        this IApplicationDbContext context,
        IDbExceptionClassifier classifier,
        ConflictException conflict,
        CancellationToken cancellationToken
    )
    {
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (classifier.IsUniqueViolation(exception))
        {
            throw conflict;
        }
    }

    public static async Task<T> GetOrCreateAsync<T>(
        this IApplicationDbContext context,
        DbSet<T> set,
        Expression<Func<T, bool>> match,
        Func<T> create,
        IDbExceptionClassifier classifier,
        CancellationToken cancellationToken
    )
        where T : class
    {
        if (await set.FirstOrDefaultAsync(match, cancellationToken) is { } existing)
        {
            return existing;
        }

        var created = create();
        set.Add(created);
        try
        {
            await context.SaveChangesAsync(cancellationToken);

            return created;
        }
        catch (DbUpdateException exception) when (classifier.IsUniqueViolation(exception))
        {
            set.Remove(created);

            return await set.SingleAsync(match, cancellationToken);
        }
    }
}
