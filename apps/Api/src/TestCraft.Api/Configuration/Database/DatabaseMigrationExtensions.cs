using TestCraft.Persistence;

namespace TestCraft.Api.Configuration.Database;

public static class DatabaseMigrationExtensions
{
    public static async Task MigrateDatabaseAsync(this WebApplication app)
    {
        var migrationOptions = app.Services.GetRequiredService<DatabaseMigrationOptions>();
        if (!migrationOptions.ApplyMigrations)
        {
            return;
        }

        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var migrationLogger = scope
            .ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger(typeof(AppDbContextMigrator));

        await AppDbContextMigrator.MigrateWithRetryAsync(dbContext, migrationLogger);
    }
}
