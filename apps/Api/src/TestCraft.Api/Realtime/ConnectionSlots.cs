using StackExchange.Redis;

namespace TestCraft.Api.Realtime;

public interface IConnectionSlots
{
    Task<bool> TryAcquireAsync(UserId userId);

    Task ReleaseAsync(UserId userId);
}

public sealed class RedisConnectionSlots(IConnectionMultiplexer redis, int maxPerUser)
    : IConnectionSlots
{
    private static readonly TimeSpan SlotTtl = TimeSpan.FromHours(1);

    private const string ReleaseScript = """
        if tonumber(redis.call('GET', KEYS[1]) or '0') <= 1 then
          return redis.call('DEL', KEYS[1])
        end
        redis.call('DECR', KEYS[1])
        return redis.call('EXPIRE', KEYS[1], ARGV[1])
        """;

    public async Task<bool> TryAcquireAsync(UserId userId)
    {
        var database = redis.GetDatabase();
        var key = Key(userId);
        var transaction = database.CreateTransaction();
        var count = transaction.StringIncrementAsync(key);
        _ = transaction.KeyExpireAsync(key, SlotTtl);
        await transaction.ExecuteAsync();

        if (await count <= maxPerUser)
        {
            return true;
        }

        await database.StringDecrementAsync(key);

        return false;
    }

    public Task ReleaseAsync(UserId userId) =>
        redis
            .GetDatabase()
            .ScriptEvaluateAsync(ReleaseScript, [Key(userId)], [(long)SlotTtl.TotalSeconds]);

    private static RedisKey Key(UserId userId) => $"ws_connections:{userId.Value}";
}
