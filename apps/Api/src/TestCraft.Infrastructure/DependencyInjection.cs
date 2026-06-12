using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Auth;
using TestCraft.Infrastructure.Caching;
using TestCraft.Infrastructure.Configuration;
using TestCraft.Infrastructure.Persistence;

namespace TestCraft.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        var options = InfrastructureOptions.Bind(configuration);

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

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<IDbExceptionClassifier, PostgresExceptionClassifier>();

        return services;
    }
}
