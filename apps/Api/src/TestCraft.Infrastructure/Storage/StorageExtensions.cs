using Microsoft.Extensions.DependencyInjection;

using Minio;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Storage;

public static class StorageExtensions
{
    public static IServiceCollection AddStorage(
        this IServiceCollection services,
        InfrastructureOptions options
    )
    {
        if (options.IsMinioConfigured)
        {
            var minioClient = new MinioClient()
                .WithEndpoint(options.MinioEndpoint)
                .WithCredentials(options.MinioAccessKey, options.MinioSecretKey)
                .WithSSL(options.MinioUseSsl)
                .Build();
            services.AddSingleton<IMinioClient>(minioClient);

            var presigningClient = string.IsNullOrEmpty(options.MinioPublicEndpoint)
                ? minioClient
                : new MinioClient()
                    .WithEndpoint(options.MinioPublicEndpoint)
                    .WithCredentials(options.MinioAccessKey, options.MinioSecretKey)
                    .WithSSL(options.MinioUseSsl)
                    .Build();
            services.AddKeyedSingleton<IMinioClient>(
                MinioStorageServiceKeys.PresigningClient,
                presigningClient
            );

            services.AddScoped<IStorageService, MinioStorageService>();
        }
        else
        {
            services.AddScoped<IStorageService, UnconfiguredStorageService>();
        }

        return services;
    }
}
