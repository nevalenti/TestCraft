using StackExchange.Redis;

namespace TestCraft.Api.Configuration.RateLimiting;

public interface IRateLimitCounter
{
    Task<int?> HitAsync(string key, int limit);
}

internal static class RateLimitWindow
{
    public static readonly TimeSpan Length = TimeSpan.FromMinutes(15);
}

public sealed partial class RedisRateLimitCounter(
    IConnectionMultiplexer redis,
    ILogger<RedisRateLimitCounter> logger
) : IRateLimitCounter
{
    private static readonly TimeSpan Timeout = TimeSpan.FromMilliseconds(250);

    public async Task<int?> HitAsync(string key, int limit)
    {
        RedisKey redisKey = $"ratelimit:{key}";
        try
        {
            var transaction = redis.GetDatabase().CreateTransaction();
            _ = transaction.StringSetAsync(redisKey, 0, RateLimitWindow.Length, When.NotExists);
            var count = transaction.StringIncrementAsync(redisKey);
            var ttl = transaction.KeyTimeToLiveAsync(redisKey);
            await transaction.ExecuteAsync().WaitAsync(Timeout);

            var resetIn = (int)Math.Ceiling((await ttl)?.TotalSeconds ?? 0);

            return await count > limit ? Math.Max(1, resetIn) : null;
        }
        catch (Exception exception) when (exception is RedisException or TimeoutException)
        {
            LogUnavailable(logger, exception);

            return null;
        }
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Rate limit store unavailable; request allowed"
    )]
    private static partial void LogUnavailable(ILogger logger, Exception exception);
}
