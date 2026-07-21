using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Infrastructure.Storage;

public class UnconfiguredStorageService : IStorageService
{
    private const string Message =
        "Storage is not configured. Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY.";

    public Task<string> UploadAsync(
        string key,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default
    ) => throw new InvalidOperationException(Message);

    public Task DeleteAsync(string key, CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException(Message);

    public Task<string> GetPresignedUrlAsync(
        string key,
        TimeSpan expiry,
        CancellationToken cancellationToken = default
    ) => throw new InvalidOperationException(Message);
}
