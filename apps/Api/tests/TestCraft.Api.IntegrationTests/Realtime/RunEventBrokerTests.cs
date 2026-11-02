using FluentAssertions;
using TestCraft.Api.Realtime;

namespace TestCraft.Api.IntegrationTests.Realtime;

public class RunEventBrokerTests
{
    [Fact]
    public async Task Publish_ToASubscriberThatFellBehind_EndsItsStreamInsteadOfDroppingMessages()
    {
        var broker = new RunEventBroker();
        var runId = TestRunId.From(Guid.NewGuid());
        using var subscription = broker.SubscribeToRun(runId);

        for (var index = 0; index <= 256; index++)
        {
            broker.Publish(runId, $"message {index}");
        }

        var received = new List<string>();
        await foreach (var message in subscription.Messages.ReadAllAsync())
        {
            received.Add(message);
        }

        received.Should().HaveCount(256);
        received[0].Should().Be("message 0");
    }
}
