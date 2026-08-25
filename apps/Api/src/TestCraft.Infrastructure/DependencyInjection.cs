using System.Net.Http;

using MassTransit;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Minio;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Auth;
using TestCraft.Infrastructure.Caching;
using TestCraft.Infrastructure.Configuration;
using TestCraft.Infrastructure.Email;
using TestCraft.Infrastructure.FeatureToggles;
using TestCraft.Infrastructure.Notifications;
using TestCraft.Infrastructure.Security;
using TestCraft.Infrastructure.Storage;
using TestCraft.Persistence;

namespace TestCraft.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        var options = InfrastructureOptions.Bind(configuration);

        services.AddStartupOptions(options);

        services.AddPersistence(
            ConnectionStringHelpers.ToNpgsqlConnectionString(options.DatabaseUrl)
        );

        if (!string.IsNullOrEmpty(options.RedisUrl))
        {
            services.AddStackExchangeRedisCache(cacheOptions =>
                cacheOptions.Configuration = RedisConnectionStringHelpers.ToRedisConfiguration(
                    options.RedisUrl
                )
            );
            services.AddSingleton<ICacheService, DistributedCacheService>();
        }
        else
        {
            services.AddSingleton<ICacheService, NoOpCacheService>();
        }

        services.AddMassTransit(busConfig =>
        {
            busConfig.AddConsumers(typeof(Application.DependencyInjection).Assembly);

            if (!string.IsNullOrEmpty(options.RabbitMqUrl))
            {
                busConfig.UsingRabbitMq(
                    (context, config) =>
                    {
                        config.Host(new Uri(options.RabbitMqUrl));
                        config.UseMessageRetry(retry =>
                            retry.Exponential(
                                retryLimit: 3,
                                minInterval: TimeSpan.FromSeconds(1),
                                maxInterval: TimeSpan.FromSeconds(30),
                                intervalDelta: TimeSpan.FromSeconds(5)
                            )
                        );
                        config.ConfigureEndpoints(context);
                    }
                );
            }
            else
            {
                busConfig.UsingInMemory(
                    (context, config) =>
                    {
                        config.UseMessageRetry(retry => retry.Immediate(3));
                        config.ConfigureEndpoints(context);
                    }
                );
            }
        });

        if (
            !string.IsNullOrEmpty(options.MinioAccessKey)
            && !string.IsNullOrEmpty(options.MinioSecretKey)
        )
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

        if (!string.IsNullOrEmpty(options.SmtpHost))
        {
            services.AddScoped<IEmailService, MailKitEmailService>();
        }
        else
        {
            services.AddScoped<IEmailService, NoOpEmailService>();
        }
        services.AddKeyedSingleton<IFeatureToggle>(
            FeatureToggleNames.NotificationDeliveryRetry,
            new FeatureToggle(options.NotificationDeliveryRetryEnabled)
        );
        services.AddScoped<INotificationDispatcher, NotificationDispatcher>();
        services.AddSingleton<IApiTokenHasher, ApiTokenHasher>();

        services
            .AddHttpClient("notifications")
            .ConfigurePrimaryHttpMessageHandler(() =>
                new SocketsHttpHandler { ConnectCallback = SafeWebhookConnectCallback.ConnectAsync }
            )
            .AddStandardResilienceHandler();

        services.AddHttpClient("keycloak-admin").AddStandardResilienceHandler();
        services.AddSingleton<IKeycloakAdminTokenProvider, KeycloakAdminTokenProvider>();
        services.AddScoped<IKeycloakUserDirectory, KeycloakUserDirectory>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        return services;
    }
}
