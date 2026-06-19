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
        // SDK limitation: PresignedGetObjectAsync does not accept CancellationToken
        return await minio.PresignedGetObjectAsync(
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
            // Bucket was created by a concurrent request — verify it now exists before rethrowing
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
