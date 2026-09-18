using TestCraft.Infrastructure.Configuration;
using TestCraft.Persistence;
using TestCraft.Persistence.Seeding;

namespace TestCraft.Api.Configuration.Database;

public static partial class DatabaseSeedExtensions
{
    public static async Task SeedDevelopmentDataAsync(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            return;
        }

        var seedLogger = app.Services.GetRequiredService<ILogger<DataSeeder>>();
        var ownerId = ResolveOwnerId(app.Configuration, seedLogger);
        var infrastructureOptions = app.Services.GetRequiredService<InfrastructureOptions>();

        await using var dbContext = AppDbContextFactory.Create(infrastructureOptions.DatabaseUrl);
        var seeder = new DataSeeder(dbContext, seedLogger);

        try
        {
            await seeder.SeedAsync(ownerId, reset: false, CancellationToken.None);
        }
        catch (Exception exception)
        {
            LogSeedingFailed(seedLogger, exception);
        }
    }

    private static UserId ResolveOwnerId(IConfiguration configuration, ILogger logger)
    {
        var raw = configuration[SeedOwner.EnvironmentVariable];
        if (Guid.TryParse(raw, out var guid))
        {
            return UserId.From(guid);
        }

        LogUsingSyntheticOwner(logger, SeedOwner.DefaultId);
        return SeedOwner.DefaultId;
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Seeding development data failed, continuing startup"
    )]
    private static partial void LogSeedingFailed(ILogger logger, Exception exception);

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "SEED_OWNER_USER_ID not set — seeding dev data under synthetic user {OwnerId}. "
            + "Set SEED_OWNER_USER_ID to your Keycloak user id to see it after logging in"
    )]
    private static partial void LogUsingSyntheticOwner(ILogger logger, UserId ownerId);
}
