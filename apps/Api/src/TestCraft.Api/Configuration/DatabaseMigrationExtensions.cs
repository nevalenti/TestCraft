using Microsoft.EntityFrameworkCore;
using TestCraft.Infrastructure.Persistence;

namespace TestCraft.Api.Configuration;

public static class DatabaseMigrationExtensions
{
    public static async Task MigrateDatabaseAsync(this WebApplication app)
    {
        var apiOptions = app.Services.GetRequiredService<ApiOptions>();
        if (!apiOptions.ApplyMigrations)
        {
            return;
        }

        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();
    }
}
