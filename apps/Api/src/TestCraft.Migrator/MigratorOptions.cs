using System.Diagnostics.CodeAnalysis;

using Microsoft.Extensions.Logging;

using TestCraft.Domain.ValueObjects;
using TestCraft.Persistence.Seeding;

namespace TestCraft.Migrator;

internal sealed record MigratorOptions(string DatabaseUrl, bool Seed, bool Reset, UserId OwnerId)
{
    private const string OwnerPrefix = "--owner=";

    public static bool TryParse(
        string[] args,
        ILogger logger,
        [NotNullWhen(true)] out MigratorOptions? options
    )
    {
        options = null;

        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (string.IsNullOrEmpty(databaseUrl))
        {
            MigratorLog.DatabaseUrlMissing(logger);
            return false;
        }

        var seed = args.Contains("seed", StringComparer.OrdinalIgnoreCase);
        var reset = args.Contains("--reset", StringComparer.OrdinalIgnoreCase);

        var ownerId = SeedOwner.DefaultId;
        if (seed && !TryResolveOwner(args, logger, out ownerId))
        {
            return false;
        }

        options = new MigratorOptions(databaseUrl, seed, reset, ownerId);
        return true;
    }

    private static bool TryResolveOwner(string[] args, ILogger logger, out UserId ownerId)
    {
        ownerId = SeedOwner.DefaultId;

        var ownerArg = args.FirstOrDefault(arg =>
            arg.StartsWith(OwnerPrefix, StringComparison.OrdinalIgnoreCase)
        );
        var raw =
            ownerArg?[OwnerPrefix.Length..]
            ?? Environment.GetEnvironmentVariable(SeedOwner.EnvironmentVariable);

        if (string.IsNullOrWhiteSpace(raw))
        {
            MigratorLog.UsingDefaultOwner(logger, ownerId);
            return true;
        }

        if (Guid.TryParse(raw, out var guid))
        {
            ownerId = UserId.From(guid);
            return true;
        }

        MigratorLog.InvalidOwner(logger, raw);
        return false;
    }
}
