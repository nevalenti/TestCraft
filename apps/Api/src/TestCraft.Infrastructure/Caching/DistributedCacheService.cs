using System.Text.Json;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Infrastructure.Caching;

public partial class DistributedCacheService(
    IDistributedCache cache,
    ILogger<DistributedCacheService> logger
) : ICacheService
{
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromSeconds(300);

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var value = await cache.GetStringAsync(key, cancellationToken);

            return value is null ? default : JsonSerializer.Deserialize<T>(value);
        }
        catch (Exception ex)
        {
            LogCacheGetFailed(logger, ex, key);

            return default;
        }
    }

    public async Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl ?? DefaultTtl,
            };
            await cache.SetStringAsync(
                key,
                JsonSerializer.Serialize(value),
                options,
                cancellationToken
            );
        }
        catch (Exception ex)
        {
            LogCacheSetFailed(logger, ex, key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await cache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            LogCacheDeleteFailed(logger, ex, key);
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Cache get failed for key {Key}")]
    private static partial void LogCacheGetFailed(ILogger logger, Exception exception, string key);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Cache set failed for key {Key}")]
    private static partial void LogCacheSetFailed(ILogger logger, Exception exception, string key);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Cache delete failed for key {Key}")]
    private static partial void LogCacheDeleteFailed(
        ILogger logger,
        Exception exception,
        string key
    );
}
