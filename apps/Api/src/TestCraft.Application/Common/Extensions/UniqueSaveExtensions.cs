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
}
