using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Storage;

public static class MinioStorageServiceKeys
{
    public const string PresigningClient = "minio-presigning";
}

public class MinioStorageService(
    IMinioClient minio,
    [FromKeyedServices(MinioStorageServiceKeys.PresigningClient)] IMinioClient presigningClient,
    IOptions<InfrastructureOptions> options
) : IStorageService
{
    private static readonly HashSet<string> InlineRenderableContentTypes = new(
        StringComparer.OrdinalIgnoreCase
    )
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/bmp",
        "image/x-icon",
    };

    public async Task<string> UploadAsync(
        string key,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default
    )
    {
        await EnsureBucketAsync(cancellationToken);

        var putArgs = new PutObjectArgs()
            .WithBucket(options.Value.MinioBucket)
            .WithObject(key)
            .WithStreamData(content)
            .WithObjectSize(content.CanSeek ? content.Length : -1)
            .WithContentType(contentType);

        if (!InlineRenderableContentTypes.Contains(contentType))
        {
            putArgs = putArgs.WithHeaders(
                new Dictionary<string, string> { ["Content-Disposition"] = "attachment" }
            );
        }

        await minio.PutObjectAsync(putArgs, cancellationToken);

        return key;
    }

    public async Task<byte[]> DownloadAsync(
        string key,
        CancellationToken cancellationToken = default
    )
    {
        using var buffer = new MemoryStream();
        await minio.GetObjectAsync(
            new GetObjectArgs()
                .WithBucket(options.Value.MinioBucket)
                .WithObject(key)
                .WithCallbackStream((stream, token) => stream.CopyToAsync(buffer, token)),
            cancellationToken
        );

        return buffer.ToArray();
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        await minio.RemoveObjectAsync(
            new RemoveObjectArgs().WithBucket(options.Value.MinioBucket).WithObject(key),
            cancellationToken
        );
    }

    public async Task<string> GetPresignedUrlAsync(
        string key,
        TimeSpan expiry,
        CancellationToken cancellationToken = default
    )
    {
        return await presigningClient.PresignedGetObjectAsync(
            new PresignedGetObjectArgs()
                .WithBucket(options.Value.MinioBucket)
                .WithObject(key)
                .WithExpiry((int)expiry.TotalSeconds)
        );
    }

    private async Task EnsureBucketAsync(CancellationToken cancellationToken)
    {
        var exists = await minio.BucketExistsAsync(
            new BucketExistsArgs().WithBucket(options.Value.MinioBucket),
            cancellationToken
        );

        if (exists)
        {
            return;
        }

        try
        {
            await minio.MakeBucketAsync(
                new MakeBucketArgs().WithBucket(options.Value.MinioBucket),
                cancellationToken
            );
        }
        catch (MinioException)
        {
            if (
                !await minio.BucketExistsAsync(
                    new BucketExistsArgs().WithBucket(options.Value.MinioBucket),
                    cancellationToken
                )
            )
            {
                throw;
            }
        }
    }
}
