using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Infrastructure.Persistence;

namespace TestCraft.Application.UnitTests.Common.Fakes;

internal sealed class NoopPublisher : IPublisher
{
    public Task Publish(object notification, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task Publish<TNotification>(
        TNotification notification,
        CancellationToken cancellationToken = default
    )
        where TNotification : INotification => Task.CompletedTask;
}

internal static class TestDbContextFactory
{
    public static AppDbContext Create(IPublisher? publisher = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options, publisher ?? new NoopPublisher());
    }
}
