using System.Text;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Features.Notes;

internal static partial class NoteContent
{
    public static async Task DeleteReplacedAsync(
        IStorageService storage,
        string key,
        ILogger logger
    )
    {
        try
        {
            await storage.DeleteAsync(key, CancellationToken.None);
        }
#pragma warning disable CA1031 // Any storage failure is logged; the saved change stands.
        catch (Exception exception)
#pragma warning restore CA1031
        {
            LogOrphanedContent(logger, exception, key);
        }
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Could not delete note content {StorageKey}"
    )]
    private static partial void LogOrphanedContent(
        ILogger logger,
        Exception exception,
        string storageKey
    );

    public static async Task<string> StoreAsync(
        IStorageService storage,
        NoteScope scope,
        string content,
        CancellationToken cancellationToken
    )
    {
        var key = scope.NewStorageKey();
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
        await storage.UploadAsync(key, stream, NoteRules.ContentType, cancellationToken);

        return key;
    }

    public static async Task SaveOrDiscardAsync(
        IApplicationDbContext context,
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
}
