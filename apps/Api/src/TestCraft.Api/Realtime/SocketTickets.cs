using System.Collections.Concurrent;
using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using StackExchange.Redis;

namespace TestCraft.Api.Realtime;

public sealed class SocketTickets(ISocketTicketStore store)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromSeconds(30);

    public Task<string> IssueForRunAsync(
        UserId userId,
        TestRunId runId,
        DateTimeOffset sessionExpiresAt
    ) => IssueAsync(new Grant(userId, runId, sessionExpiresAt));

    public Task<string> IssueForDashboardAsync(UserId userId, DateTimeOffset sessionExpiresAt) =>
        IssueAsync(new Grant(userId, null, sessionExpiresAt));

    public Task<Grant?> RedeemAsync(string ticket) =>
        string.IsNullOrEmpty(ticket) ? Task.FromResult<Grant?>(null) : store.TakeAsync(ticket);

    private async Task<string> IssueAsync(Grant grant)
    {
        var ticket = Convert
            .ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        await store.SaveAsync(ticket, grant, Lifetime);

        return ticket;
    }

    public sealed record Grant(UserId UserId, TestRunId? RunId, DateTimeOffset SessionExpiresAt);
}

public interface ISocketTicketStore
{
    Task SaveAsync(string ticket, SocketTickets.Grant grant, TimeSpan lifetime);

    Task<SocketTickets.Grant?> TakeAsync(string ticket);
}

public sealed class InMemorySocketTicketStore(TimeProvider timeProvider) : ISocketTicketStore
{
    private const int SweepThreshold = 1_000;

    private readonly ConcurrentDictionary<
        string,
        (SocketTickets.Grant Grant, DateTimeOffset RedeemBy)
    > _grants = new(StringComparer.Ordinal);

    public Task SaveAsync(string ticket, SocketTickets.Grant grant, TimeSpan lifetime)
    {
        var now = timeProvider.GetUtcNow();
        if (_grants.Count > SweepThreshold)
        {
            foreach (var (stale, entry) in _grants)
            {
                if (entry.RedeemBy <= now)
                {
                    _grants.TryRemove(stale, out _);
                }
            }
        }

        _grants[ticket] = (grant, now + lifetime);

        return Task.CompletedTask;
    }

    public Task<SocketTickets.Grant?> TakeAsync(string ticket) =>
        Task.FromResult(
            _grants.TryRemove(ticket, out var entry) && entry.RedeemBy > timeProvider.GetUtcNow()
                ? entry.Grant
                : null
        );
}

public sealed class RedisSocketTicketStore(IConnectionMultiplexer redis) : ISocketTicketStore
{
    private const string RunKind = "run";
    private const string DashboardKind = "dashboard";

    public Task SaveAsync(string ticket, SocketTickets.Grant grant, TimeSpan lifetime) =>
        redis
            .GetDatabase()
            .StringSetAsync(
                Key(ticket),
                JsonSerializer.Serialize(
                    new StoredGrant(
                        grant.RunId is null ? DashboardKind : RunKind,
                        grant.UserId.Value.ToString(),
                        grant.RunId?.Value.ToString(),
                        grant.SessionExpiresAt.ToUnixTimeMilliseconds() / 1000.0
                    ),
                    StoredGrant.SerializerOptions
                ),
                lifetime
            );

    public async Task<SocketTickets.Grant?> TakeAsync(string ticket)
    {
        var value = await redis.GetDatabase().StringGetDeleteAsync(Key(ticket));
        if (value.IsNullOrEmpty)
        {
            return null;
        }

        var stored = JsonSerializer.Deserialize<StoredGrant>(
            value.ToString(),
            StoredGrant.SerializerOptions
        );

        if (stored is null)
        {
            return null;
        }

        TestRunId? runId = stored is { Kind: RunKind, RunId: { } run }
            ? TestRunId.From(Guid.Parse(run, CultureInfo.InvariantCulture))
            : null;

        return new SocketTickets.Grant(
            UserId.From(Guid.Parse(stored.UserId, CultureInfo.InvariantCulture)),
            runId,
            DateTimeOffset.FromUnixTimeMilliseconds((long)(stored.ExpiresAt * 1000))
        );
    }

    private static RedisKey Key(string ticket) => $"ws_ticket:{ticket}";

    private sealed record StoredGrant(string Kind, string UserId, string? RunId, double ExpiresAt)
    {
        public static readonly JsonSerializerOptions SerializerOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = System
                .Text
                .Json
                .Serialization
                .JsonIgnoreCondition
                .WhenWritingNull,
        };
    }
}
