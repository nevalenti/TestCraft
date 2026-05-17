using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Infrastructure.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
        var port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
        var database = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "testcraft_db";
        var user = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "testcraft";
        var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "changeme";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql($"Host={host};Port={port};Database={database};Username={user};Password={password}")
            .Options;

        return new AppDbContext(options);
    }
}