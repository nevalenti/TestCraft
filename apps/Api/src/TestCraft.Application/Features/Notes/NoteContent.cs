using System.Text;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Features.Notes;

internal static class NoteContent
{
    public static async Task<string> StoreAsync(
        IStorageService storage,
        NoteScope scope,
        string content,
        CancellationToken cancellationToken
    )
    {
        var key = scope.NewStorageKey();
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
        await storage.UploadAsync(
            key,
            stream,
            NoteRules.ContentType,
            forceDownload: false,
            cancellationToken: cancellationToken
        );

        return key;
    }
}
