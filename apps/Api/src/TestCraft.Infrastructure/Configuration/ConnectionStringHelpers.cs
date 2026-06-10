using Npgsql;

namespace TestCraft.Infrastructure.Configuration;

public static class ConnectionStringHelpers
{
    public static string ToNpgsqlConnectionString(string databaseUrl)
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

        return builder.ConnectionString;
    }

    public static string ToRedisConfiguration(string redisUrl)
    {
        var uri = new Uri(redisUrl);
        var config = $"{uri.Host}:{(uri.Port > 0 ? uri.Port : 6379)}";

        if (!string.IsNullOrEmpty(uri.UserInfo))
        {
            var password = uri.UserInfo.Split(':', 2) is [_, var pwd]
                ? pwd
                : uri.UserInfo;
            config += $",password={Uri.UnescapeDataString(password)}";
        }

        return config;
    }
}
