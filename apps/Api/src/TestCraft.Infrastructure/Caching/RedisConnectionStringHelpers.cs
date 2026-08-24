namespace TestCraft.Infrastructure.Caching;

public static class RedisConnectionStringHelpers
{
    public static string ToRedisConfiguration(string redisUrl)
    {
        var uri = new Uri(redisUrl);
        var config = $"{uri.Host}:{(uri.Port > 0 ? uri.Port : 6379)}";

        if (!string.IsNullOrEmpty(uri.UserInfo))
        {
            var password = uri.UserInfo.Split(':', 2) is [_, var pwd] ? pwd : uri.UserInfo;
            config += $",password={Uri.UnescapeDataString(password)}";
        }

        return config;
    }
}
