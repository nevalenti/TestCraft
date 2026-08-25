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

        await AppDbContextMigrator.MigrateWithRetryAsync(dbContext, app.Logger);
    }
}
