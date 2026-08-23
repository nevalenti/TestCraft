using MassTransit;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.Notifications.Contracts;

namespace TestCraft.Application.Features.Notifications.Consumers;

public class RunStatusChangedConsumer(INotificationDispatcher dispatcher)
    : IConsumer<RunStatusChanged>
{
    public async Task Consume(ConsumeContext<RunStatusChanged> context)
    {
        var message = context.Message;

        if (message.NewStatus == "Completed")
        {
            await dispatcher.DispatchRunCompletedAsync(
                message.ProjectId,
                message.RunId,
                message.RunName,
                context.CancellationToken
            );
        }
    }
}
