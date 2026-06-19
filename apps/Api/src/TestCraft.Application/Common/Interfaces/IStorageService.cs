namespace TestCraft.Application.Common.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(
        string key,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default
    );

    Task DeleteAsync(string key, CancellationToken cancellationToken = default);

    Task<string> GetPresignedUrlAsync(
        string key,
        TimeSpan expiry,
        CancellationToken cancellationToken = default
    );
}
