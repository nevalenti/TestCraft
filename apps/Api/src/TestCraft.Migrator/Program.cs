using DotNetEnv;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using TestCraft.Persistence;

#pragma warning disable CA1848

Env.NoClobber().TraversePath().Load();

using var loggerFactory = LoggerFactory.Create(builder =>
    builder.AddSimpleConsole(options =>
    {
        options.SingleLine = true;
        options.TimestampFormat = "HH:mm:ss ";
    })
);
var logger = loggerFactory.CreateLogger("Migrator");

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (string.IsNullOrEmpty(databaseUrl))
{
    logger.LogCritical("DATABASE_URL is not set");
    return 1;
}

var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
optionsBuilder.UseNpgsql(ConnectionStringHelpers.ToNpgsqlConnectionString(databaseUrl));

await using var dbContext = new AppDbContext(optionsBuilder.Options, new NullPublisher());

try
{
    await AppDbContextMigrator.MigrateWithRetryAsync(dbContext, logger);
}
catch
{
    return 1;
}

logger.LogInformation("Migrations applied successfully");
return 0;
