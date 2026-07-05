using TestCraft.Application.Caching;

namespace TestCraft.Application.UnitTests.Common;

internal sealed class NoopCacheService : ICacheService
{
    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) =>
        Task.FromResult<T?>(default);

    public Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default
    ) => Task.CompletedTask;

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
