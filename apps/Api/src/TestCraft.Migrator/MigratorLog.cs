using Microsoft.Extensions.Logging;

using TestCraft.Domain.ValueObjects;

namespace TestCraft.Migrator;

internal static partial class MigratorLog
{
    [LoggerMessage(Level = LogLevel.Critical, Message = "DATABASE_URL is not set")]
    public static partial void DatabaseUrlMissing(ILogger logger);

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "No --owner or SEED_OWNER_USER_ID set — seeding under default user {OwnerId}. "
            + "Pass your Keycloak user id to see this data after logging in"
    )]
    public static partial void UsingDefaultOwner(ILogger logger, UserId ownerId);

    [LoggerMessage(
        Level = LogLevel.Critical,
        Message = "Invalid --owner/SEED_OWNER_USER_ID value '{Raw}' — expected a GUID"
    )]
    public static partial void InvalidOwner(ILogger logger, string raw);

    [LoggerMessage(Level = LogLevel.Information, Message = "Migrations applied successfully")]
    public static partial void MigrationsApplied(ILogger logger);

    [LoggerMessage(Level = LogLevel.Critical, Message = "Seeding failed")]
    public static partial void SeedingFailed(ILogger logger, Exception exception);
}
