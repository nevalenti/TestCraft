using StackExchange.Redis;

namespace TestCraft.Infrastructure.Caching;

public static class RedisConnectionStringHelpers
{
    public static ConfigurationOptions ToRedisConfigurationOptions(string redisUrl)
    {
        var uri = new Uri(redisUrl);
        var options = new ConfigurationOptions
        {
            EndPoints = { { uri.Host, uri.Port > 0 ? uri.Port : 6379 } },
            Ssl = string.Equals(uri.Scheme, "rediss", StringComparison.OrdinalIgnoreCase),
        };

        if (!string.IsNullOrEmpty(uri.UserInfo))
        {
            var password = uri.UserInfo.Split(':', 2) is [_, var pwd] ? pwd : uri.UserInfo;
            options.Password = Uri.UnescapeDataString(password);
        }

        return options;
    }

    public static string ToRedisConfiguration(string redisUrl) =>
        ToRedisConfigurationOptions(redisUrl).ToString();
}
