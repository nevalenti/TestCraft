using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Database;

public sealed class DatabaseMigrationOptions : IStartupOptions
{
    [NotSensitive]
    [ConfigurationKeyName("APPLY_MIGRATIONS")]
    public bool ApplyMigrations { get; set; }
}
