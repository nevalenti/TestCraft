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
        var databaseUrl =
            configuration["DATABASE_URL"]
            ?? throw new InvalidOperationException(
                "DATABASE_URL is not configured"
            );

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                ConnectionStringHelpers.ToNpgsqlConnectionString(databaseUrl)
            )
        );

        var redisUrl = configuration["REDIS_URL"];
        if (!string.IsNullOrEmpty(redisUrl))
        {
            services.AddStackExchangeRedisCache(options =>
                options.Configuration =
                    ConnectionStringHelpers.ToRedisConfiguration(redisUrl)
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

        return services;
    }
}
