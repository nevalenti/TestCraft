using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Persistence;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
#pragma warning disable S1075, S2068
    private const string DesignTimeDatabaseUrl =
        "postgresql://testcraft:changeme@localhost:5432/testcraft_dotnet_db";
#pragma warning restore S1075, S2068

    public AppDbContext CreateDbContext(string[] args)
    {
        var databaseUrl =
            Environment.GetEnvironmentVariable("DATABASE_URL") ?? DesignTimeDatabaseUrl;

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(ConnectionStringHelpers.ToNpgsqlConnectionString(databaseUrl));

        return new AppDbContext(optionsBuilder.Options);
    }
}
