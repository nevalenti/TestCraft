using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Storage;

public class MinioStorageService(IMinioClient minio, InfrastructureOptions options)
    : IStorageService
{
    // Presigned URLs must be signed with the host the browser uses, not the
    // internal cluster host. A separate client scoped to the public endpoint ensures
    // the HMAC signature matches when the browser hits the URL directly.
    private readonly IMinioClient _presigningClient = string.IsNullOrEmpty(
        options.MinioPublicEndpoint
    )
        ? minio
        : new MinioClient()
            .WithEndpoint(options.MinioPublicEndpoint)
            .WithCredentials(options.MinioAccessKey, options.MinioSecretKey)
            .WithSSL(options.MinioUseSsl)
            .Build();

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
        return await _presigningClient.PresignedGetObjectAsync(
            new PresignedGetObjectArgs()
                .WithBucket(options.MinioBucket)
                .WithObject(key)
                .WithExpiry((int)expiry.TotalSeconds)
        );
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
