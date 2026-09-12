using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Domain.ValueObjects;
using TestCraft.Persistence;
using TestCraft.Persistence.Seeding;

#pragma warning disable CA1848, CA1873

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

var migrationLogger = loggerFactory.CreateLogger(typeof(AppDbContextMigrator));

try
{
    await AppDbContextMigrator.MigrateWithRetryAsync(dbContext, migrationLogger);
}
catch
{
    return 1;
}

logger.LogInformation("Migrations applied successfully");

if (!args.Contains("seed", StringComparer.OrdinalIgnoreCase))
{
    return 0;
}

var seedLogger = loggerFactory.CreateLogger<DataSeeder>();

var ownerArg = args.FirstOrDefault(arg =>
    arg.StartsWith("--owner=", StringComparison.OrdinalIgnoreCase)
);
var ownerRaw =
    ownerArg?["--owner=".Length..] ?? Environment.GetEnvironmentVariable("SEED_OWNER_USER_ID");

UserId ownerId;
if (string.IsNullOrWhiteSpace(ownerRaw))
{
    ownerId = UserId.New();
    seedLogger.LogWarning(
        "No --owner or SEED_OWNER_USER_ID set — seeding under synthetic user {OwnerId}. "
            + "Pass your Keycloak user id to see this data after logging in",
        ownerId
    );
}
else if (Guid.TryParse(ownerRaw, out var ownerGuid))
{
    ownerId = UserId.From(ownerGuid);
}
else
{
    logger.LogCritical(
        "Invalid --owner/SEED_OWNER_USER_ID value '{Raw}' — expected a GUID",
        ownerRaw
    );
    return 1;
}

var reset = args.Contains("--reset", StringComparer.OrdinalIgnoreCase);
var seeder = new DataSeeder(dbContext, seedLogger);

try
{
    await seeder.SeedAsync(ownerId, reset, CancellationToken.None);
}
catch (Exception exception)
{
    seedLogger.LogCritical(exception, "Seeding failed");
    return 1;
}

return 0;
