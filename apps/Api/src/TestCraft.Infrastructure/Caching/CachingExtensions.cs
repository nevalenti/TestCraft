using Microsoft.Extensions.DependencyInjection;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Caching;

public static class CachingExtensions
{
    public static IServiceCollection AddCaching(
        this IServiceCollection services,
        InfrastructureOptions options
    )
    {
        if (options.IsRedisConfigured)
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

        return services;
    }
}
