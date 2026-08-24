using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services,
        string connectionString
    )
    {
        services.AddDbContext<AppDbContext>(dbOptions =>
            dbOptions.UseNpgsql(
                connectionString,
                npgsqlOptions => npgsqlOptions.EnableRetryOnFailure()
            )
        );

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<AppDbContext>()
        );

        services.AddSingleton<IDbExceptionClassifier, PostgresExceptionClassifier>();

        return services;
    }
}
