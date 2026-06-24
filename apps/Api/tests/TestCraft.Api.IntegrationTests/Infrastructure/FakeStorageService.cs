using System.Collections.Concurrent;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

public class FakeStorageService : IStorageService
{
    private readonly ConcurrentDictionary<string, (byte[] Content, string ContentType)> _store =
        new();

    public async Task<string> UploadAsync(
        string key,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default
    )
    {
        using var ms = new MemoryStream();
        await content.CopyToAsync(ms, cancellationToken);
        _store[key] = (ms.ToArray(), contentType);
        return key;
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        _store.TryRemove(key, out _);
        return Task.CompletedTask;
    }

    public Task<string> GetPresignedUrlAsync(
        string key,
        TimeSpan expiry,
        CancellationToken cancellationToken = default
    ) =>
        Task.FromResult(
            $"http://fake-storage/{Uri.EscapeDataString(key)}?expires={(long)expiry.TotalSeconds}"
        );
}
