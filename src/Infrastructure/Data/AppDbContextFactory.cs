using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Infrastructure.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost";
        var port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5433";
        var database = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? "better_tests_db";
        var user = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "postgres";
        var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "postgres";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql($"Host={host};Port={port};Database={database};Username={user};Password={password}")
            .Options;
        return new AppDbContext(options);
    }
}