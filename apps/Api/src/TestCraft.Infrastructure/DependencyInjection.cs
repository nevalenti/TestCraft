using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Minio;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Auth;
using TestCraft.Infrastructure.Caching;
using TestCraft.Infrastructure.Configuration;
using TestCraft.Infrastructure.Email;
using TestCraft.Infrastructure.Notifications;
using TestCraft.Infrastructure.Persistence;
using TestCraft.Infrastructure.Storage;

namespace TestCraft.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        var options = InfrastructureOptions.Bind(configuration);

        services.AddSingleton(options);

        services.AddDbContext<AppDbContext>(dbOptions =>
            dbOptions.UseNpgsql(
                ConnectionStringHelpers.ToNpgsqlConnectionString(options.DatabaseUrl)
            )
        );

        if (!string.IsNullOrEmpty(options.RedisUrl))
        {
            services.AddStackExchangeRedisCache(cacheOptions =>
                cacheOptions.Configuration = ConnectionStringHelpers.ToRedisConfiguration(
                    options.RedisUrl
                )
            );
            services.AddSingleton<ICacheService, DistributedCacheService>();
        }
        else
        {
            services.AddSingleton<ICacheService, NoOpCacheService>();
        }

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<AppDbContext>()
        );

        services.AddMassTransit(busConfig =>
        {
            busConfig.AddConsumers(typeof(Application.DependencyInjection).Assembly);

            if (!string.IsNullOrEmpty(options.RabbitMqUrl))
            {
                busConfig.UsingRabbitMq(
                    (context, cfg) =>
                    {
                        cfg.Host(new Uri(options.RabbitMqUrl));
                        cfg.ConfigureEndpoints(context);
                    }
                );
            }
            else
            {
                busConfig.UsingInMemory((context, cfg) => cfg.ConfigureEndpoints(context));
            }
        });

        if (
            !string.IsNullOrEmpty(options.MinioAccessKey)
            && !string.IsNullOrEmpty(options.MinioSecretKey)
        )
        {
            services.AddSingleton<IMinioClient>(
                new MinioClient()
                    .WithEndpoint(options.MinioEndpoint)
                    .WithCredentials(options.MinioAccessKey, options.MinioSecretKey)
                    .WithSSL(options.MinioUseSsl)
                    .Build()
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
        services.AddScoped<INotificationDispatcher, NotificationDispatcher>();
        services.AddSingleton<IApiTokenHasher, ApiTokenHasher>();

        services.AddHttpClient(
            "notifications",
            client =>
            {
                client.Timeout = TimeSpan.FromSeconds(10);
            }
        );

        services.AddHttpClient(
            "keycloak-admin",
            client =>
            {
                client.Timeout = TimeSpan.FromSeconds(10);
            }
        );
        services.AddSingleton<IKeycloakAdminTokenProvider, KeycloakAdminTokenProvider>();
        services.AddScoped<IKeycloakUserDirectory, KeycloakUserDirectory>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<IDbExceptionClassifier, PostgresExceptionClassifier>();

        return services;
    }
}
