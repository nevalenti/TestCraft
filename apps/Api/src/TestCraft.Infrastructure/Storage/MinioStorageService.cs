using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Storage;

public class MinioStorageService(IMinioClient minio, InfrastructureOptions options)
    : IStorageService
{
    public async Task<string> UploadAsync(
        string key,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default
    )
    {
        await EnsureBucketAsync(cancellationToken);

        await minio.PutObjectAsync(
            new PutObjectArgs()
                .WithBucket(options.MinioBucket)
                .WithObject(key)
                .WithStreamData(content)
                .WithObjectSize(content.CanSeek ? content.Length : -1)
                .WithContentType(contentType),
            cancellationToken
        );

        return key;
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        await minio.RemoveObjectAsync(
            new RemoveObjectArgs().WithBucket(options.MinioBucket).WithObject(key),
            cancellationToken
        );
    }

    public async Task<string> GetPresignedUrlAsync(
        string key,
        TimeSpan expiry,
        CancellationToken cancellationToken = default
    )
    {
        var url = await minio.PresignedGetObjectAsync(
            new PresignedGetObjectArgs()
                .WithBucket(options.MinioBucket)
                .WithObject(key)
                .WithExpiry((int)expiry.TotalSeconds)
        );

        if (string.IsNullOrEmpty(options.MinioPublicEndpoint))
        {
            return url;
        }

        var scheme = options.MinioUseSsl ? "https" : "http";
        var publicBase = new Uri($"{scheme}://{options.MinioPublicEndpoint}");
        var uriBuilder = new UriBuilder(url)
        {
            Host = publicBase.Host,
            Port = publicBase.Port,
            Scheme = publicBase.Scheme,
        };
        if (publicBase.AbsolutePath is { Length: > 1 } prefix)
            uriBuilder.Path = prefix.TrimEnd('/') + uriBuilder.Path;
        return uriBuilder.Uri.ToString();
    }

    private async Task EnsureBucketAsync(CancellationToken cancellationToken)
    {
        var exists = await minio.BucketExistsAsync(
            new BucketExistsArgs().WithBucket(options.MinioBucket),
            cancellationToken
        );

        if (exists)
            return;

        try
        {
            await minio.MakeBucketAsync(
                new MakeBucketArgs().WithBucket(options.MinioBucket),
                cancellationToken
            );
        }
        catch (MinioException)
        {
            if (
                !await minio.BucketExistsAsync(
                    new BucketExistsArgs().WithBucket(options.MinioBucket),
                    cancellationToken
                )
            )
                throw;
        }
    }
}
