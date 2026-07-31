using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Database;

public sealed class DatabaseMigrationOptions : IStartupOptions
{
    public bool ApplyMigrations { get; init; }

    public static DatabaseMigrationOptions Bind(IConfiguration configuration) =>
        OptionsValidator.ValidateAndThrow(
            new DatabaseMigrationOptions
            {
                ApplyMigrations = configuration.GetValue<bool>("APPLY_MIGRATIONS"),
            },
            "database migration"
        );
}
