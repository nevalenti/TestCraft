using MediatR;

namespace TestCraft.Persistence;

/// <summary>No-op IPublisher for contexts that need an AppDbContext without domain-event dispatch (design-time tooling, the standalone Migrator).</summary>
public sealed class NullPublisher : IPublisher
{
    public Task Publish(object notification, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task Publish<TNotification>(
        TNotification notification,
        CancellationToken cancellationToken = default
    )
        where TNotification : INotification => Task.CompletedTask;
}
