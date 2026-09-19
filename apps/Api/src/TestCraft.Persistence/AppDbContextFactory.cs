using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TestCraft.Persistence;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
#pragma warning disable S1075, S2068
    private const string DesignTimeDatabaseUrl =
        "postgresql://testcraft:changeme@localhost:5432/testcraft_dotnet_db";
#pragma warning restore S1075, S2068

    public AppDbContext CreateDbContext(string[] args) =>
        Create(Environment.GetEnvironmentVariable("DATABASE_URL") ?? DesignTimeDatabaseUrl);

    public static AppDbContext Create(string databaseUrl)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(ConnectionStringHelpers.ToNpgsqlConnectionString(databaseUrl));

        return new AppDbContext(optionsBuilder.Options, new NullPublisher());
    }
}
