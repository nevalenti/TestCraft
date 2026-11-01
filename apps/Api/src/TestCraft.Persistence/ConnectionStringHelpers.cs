using Npgsql;

namespace TestCraft.Persistence;

public static class ConnectionStringHelpers
{
    public static string ToNpgsqlConnectionString(
        string databaseUrl,
        int? poolTimeoutSeconds = null,
        int? statementTimeoutMs = null
    )
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo[0]),
        };

        if (userInfo.Length > 1)
        {
            builder.Password = Uri.UnescapeDataString(userInfo[1]);
        }

        if (poolTimeoutSeconds is { } timeout)
        {
            builder.Timeout = timeout;
        }

        if (statementTimeoutMs is { } statementTimeout)
        {
            builder.Options = $"-c statement_timeout={statementTimeout}";
        }

        return builder.ConnectionString;
    }
}
