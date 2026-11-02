using System.Collections.Concurrent;
using System.Threading.Channels;

namespace TestCraft.Api.Realtime;

public sealed class RunEventBroker
{
    private const int SubscriberBuffer = 256;

    private readonly ConcurrentDictionary<
        TestRunId,
        ConcurrentDictionary<Guid, Channel<string>>
    > _runs = new();

    private readonly ConcurrentDictionary<Guid, DashboardSubscription> _dashboards = new();

    public void Publish(TestRunId runId, string message)
    {
        if (_runs.TryGetValue(runId, out var subscribers))
        {
            foreach (var channel in subscribers.Values)
            {
                Deliver(channel, message);
            }
        }
    }

    public void PublishDashboard(ProjectId projectId, string message)
    {
        foreach (
            var subscription in _dashboards.Values.Where(subscription =>
                subscription.Sees(projectId)
            )
        )
        {
            Deliver(subscription.Channel, message);
        }
    }

    public Subscription SubscribeToRun(TestRunId runId)
    {
        var id = Guid.NewGuid();
        var channel = CreateChannel();
        _runs.GetOrAdd(runId, _ => new ConcurrentDictionary<Guid, Channel<string>>())[id] = channel;

        return new Subscription(
            channel.Reader,
            () =>
            {
                if (_runs.TryGetValue(runId, out var subscribers))
                {
                    subscribers.TryRemove(id, out _);
                }
            }
        );
    }

    public DashboardSubscription SubscribeToDashboard(IReadOnlySet<ProjectId> projectIds)
    {
        var subscription = new DashboardSubscription(CreateChannel(), projectIds, this);
        _dashboards[subscription.Id] = subscription;

        return subscription;
    }

    private void Remove(DashboardSubscription subscription) =>
        _dashboards.TryRemove(subscription.Id, out _);

    private static Channel<string> CreateChannel() =>
        Channel.CreateBounded<string>(
            new BoundedChannelOptions(SubscriberBuffer)
            {
                FullMode = BoundedChannelFullMode.Wait,
                SingleReader = true,
            }
        );

    private static void Deliver(Channel<string> channel, string message)
    {
        if (!channel.Writer.TryWrite(message))
        {
            channel.Writer.TryComplete();
        }
    }

    public sealed class Subscription(ChannelReader<string> messages, Action unsubscribe)
        : IDisposable
    {
        public ChannelReader<string> Messages { get; } = messages;

        public void Dispose() => unsubscribe();
    }

    public sealed class DashboardSubscription : IDisposable
    {
        private readonly RunEventBroker _broker;
        private volatile IReadOnlySet<ProjectId> _projectIds;

        internal DashboardSubscription(
            Channel<string> channel,
            IReadOnlySet<ProjectId> projectIds,
            RunEventBroker broker
        )
        {
            Channel = channel;
            _projectIds = projectIds;
            _broker = broker;
        }

        public Guid Id { get; } = Guid.NewGuid();

        internal Channel<string> Channel { get; }

        public ChannelReader<string> Messages => Channel.Reader;

        public IReadOnlySet<ProjectId> ProjectIds
        {
            get => _projectIds;
            set => _projectIds = value;
        }

        internal bool Sees(ProjectId projectId) => _projectIds.Contains(projectId);

        public void Dispose() => _broker.Remove(this);
    }
}
