using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Common.Extensions;

internal static partial class StorageExtensions
{
    public static string NewKey(string prefix, string fileName) =>
        $"{prefix}/{Guid.NewGuid()}{Path.GetExtension(fileName)}";

    public static async Task SaveChangesOrDiscardAsync(
        this IApplicationDbContext context,
        IStorageService storage,
        string uploadedKey,
        CancellationToken cancellationToken
    )
    {
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await storage.DeleteAsync(uploadedKey, CancellationToken.None);
            throw;
        }
    }

    public static async Task DeleteReplacedAsync(
        this IStorageService storage,
        string key,
        ILogger logger
    )
    {
        try
        {
            await storage.DeleteAsync(key, CancellationToken.None);
        }
#pragma warning disable CA1031
        catch (Exception exception)
#pragma warning restore CA1031
        {
            LogOrphanedObject(logger, exception, key);
        }
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Could not delete stored object {StorageKey}"
    )]
    private static partial void LogOrphanedObject(
        ILogger logger,
        Exception exception,
        string storageKey
    );
}
