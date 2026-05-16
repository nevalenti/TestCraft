using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Api.Configuration.Infrastructure;

public static class Database
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
        {
            var host = configuration["POSTGRES_HOST"]
                       ?? throw new InvalidOperationException("POSTGRES_HOST is required.");
            var port = configuration["POSTGRES_PORT"]
                       ?? throw new InvalidOperationException("POSTGRES_PORT is required.");
            var database = configuration["POSTGRES_DB"]
                           ?? throw new InvalidOperationException("POSTGRES_DB is required.");
            var username = configuration["POSTGRES_USER"]
                           ?? throw new InvalidOperationException("POSTGRES_USER is required.");
            var password = configuration["POSTGRES_PASSWORD"]
                           ?? throw new InvalidOperationException("POSTGRES_PASSWORD is required.");

            options.UseNpgsql($"Host={host};Port={port};Database={database};Username={username};Password={password}");
        });

        return services;
    }

    public static void MigrateDatabase(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
    }
}