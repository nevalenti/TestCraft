using DotNetEnv;

using Microsoft.Extensions.Logging;

using TestCraft.Migrator;
using TestCraft.Persistence;
using TestCraft.Persistence.Seeding;

Env.NoClobber().TraversePath().Load();

using var loggerFactory = LoggerFactory.Create(builder =>
    builder.AddSimpleConsole(formatterOptions =>
    {
        formatterOptions.SingleLine = true;
        formatterOptions.TimestampFormat = "HH:mm:ss ";
    })
);
var logger = loggerFactory.CreateLogger("Migrator");

if (!MigratorOptions.TryParse(args, logger, out var options))
{
    return 1;
}

await using var dbContext = AppDbContextFactory.Create(options.DatabaseUrl);

try
{
    await AppDbContextMigrator.MigrateWithRetryAsync(
        dbContext,
        loggerFactory.CreateLogger(typeof(AppDbContextMigrator))
    );
}
catch
{
    return 1;
}

MigratorLog.MigrationsApplied(logger);

if (!options.Seed)
{
    return 0;
}

try
{
    var seeder = new DataSeeder(dbContext, loggerFactory.CreateLogger<DataSeeder>());
    await seeder.SeedAsync(options.OwnerId, options.Reset, CancellationToken.None);
}
catch (Exception exception)
{
    MigratorLog.SeedingFailed(logger, exception);
    return 1;
}

return 0;
